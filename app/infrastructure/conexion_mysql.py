"""Adaptador de MySQL/MariaDB con la misma interfaz que usan los repositorios.

Los repositorios escriben SQL con marcadores ? y leen las filas por nombre,
como lo hace sqlite3. Este modulo hace que una conexion PyMySQL se comporte
igual, de modo que la capa de datos no cambia al pasar de SQLite a MySQL:

* traduce los marcadores ? a %s (solo fuera de los textos entre comillas);
* entrega las filas como diccionarios que tambien aceptan indice numerico;
* convierte DECIMAL a int o float y las fechas a texto ISO, que es lo que
  los repositorios ya esperaban de SQLite;
* activa PIPES_AS_CONCAT para que || concatene en lugar de ser un OR;
* cuenta como afectadas las filas encontradas, como hace SQLite.
"""

import re
import tempfile
from pathlib import Path
from typing import Any, Iterable

import pymysql
from pymysql.constants import CLIENT, FIELD_TYPE
from pymysql.converters import conversions
from pymysql.cursors import DictCursor

from app import config

RUTA_ESQUEMA_MYSQL = config.RUTA_BASE / "sql" / "esquema_mysql.sql"


def traducir_marcadores(sql: str) -> str:
    """Cambia los marcadores ? por %s, ignorando los que van entre comillas.

    El simbolo % se duplica porque PyMySQL lo usa como caracter especial.
    """
    resultado = []
    comilla = None
    for caracter in sql:
        if comilla:
            resultado.append("%%" if caracter == "%" else caracter)
            if caracter == comilla:
                comilla = None
        elif caracter in ("'", '"'):
            comilla = caracter
            resultado.append(caracter)
        elif caracter == "?":
            resultado.append("%s")
        elif caracter == "%":
            resultado.append("%%")
        else:
            resultado.append(caracter)
    return "".join(resultado)


class FilaMySQL(dict):
    """Fila que se lee por nombre de columna o por posicion, como sqlite3.Row."""

    def __getitem__(self, clave: Any) -> Any:
        if isinstance(clave, int):
            return list(self.values())[clave]
        return super().__getitem__(clave)


class CursorFila(DictCursor):
    """Cursor que entrega cada fila como FilaMySQL."""

    dict_type = FilaMySQL


def _a_texto(valor: Any) -> str:
    return valor.decode() if isinstance(valor, bytes) else valor


def _numero(valor: Any) -> int | float:
    """DECIMAL sin parte decimal (p. ej. SUM de enteros) vuelve como int."""
    texto = _a_texto(valor)
    return float(texto) if "." in texto else int(texto)


def _fecha_hora(valor: Any) -> str:
    """DATETIME como texto ISO con T, igual al que escribe la aplicacion."""
    return _a_texto(valor).replace(" ", "T", 1)


def _convertidores() -> dict:
    """Tabla de conversion de tipos de MySQL a tipos simples de Python."""
    tabla = conversions.copy()
    tabla[FIELD_TYPE.DECIMAL] = _numero
    tabla[FIELD_TYPE.NEWDECIMAL] = _numero
    tabla[FIELD_TYPE.DATE] = _a_texto
    tabla[FIELD_TYPE.DATETIME] = _fecha_hora
    tabla[FIELD_TYPE.TIMESTAMP] = _fecha_hora
    return tabla


# MySQL (3819) y MariaDB (4025) avisan una violacion de CHECK como OperationalError;
# SQLite la reporta como IntegrityError, y los repositorios esperan esa clase.
_CODIGOS_CHECK = (3819, 4025)


def _como_integridad(error: Exception) -> Exception:
    """Convierte la violacion de un CHECK en IntegrityError; deja pasar el resto."""
    if error.args and error.args[0] in _CODIGOS_CHECK:
        nuevo = pymysql.IntegrityError(*error.args)
        nuevo.__cause__ = error
        return nuevo
    return error


class ConexionMySQL:
    """Envuelve una conexion PyMySQL con execute(), executemany() y commit()."""

    def __init__(self, conexion: pymysql.connections.Connection) -> None:
        self._conexion = conexion

    def execute(self, sql: str, parametros: Iterable = ()) -> CursorFila:
        cursor = self._conexion.cursor()
        try:
            cursor.execute(traducir_marcadores(sql), tuple(parametros))
        except pymysql.OperationalError as error:
            raise _como_integridad(error)
        return cursor

    def executemany(self, sql: str, filas: Iterable[Iterable]) -> CursorFila:
        cursor = self._conexion.cursor()
        try:
            cursor.executemany(traducir_marcadores(sql), [tuple(f) for f in filas])
        except pymysql.OperationalError as error:
            raise _como_integridad(error)
        return cursor

    def commit(self) -> None:
        self._conexion.commit()

    def rollback(self) -> None:
        self._conexion.rollback()

    def close(self) -> None:
        self._conexion.close()


def _archivo_ca() -> str | None:
    """Ruta del certificado de la autoridad del servidor, si se configuro.

    Puede venir como ruta (PASTOREANDO_MYSQL_CA) o como el texto PEM completo
    (PASTOREANDO_MYSQL_CA_PEM), util en servidores donde solo hay variables.
    """
    if config.MYSQL_CA:
        return config.MYSQL_CA
    if config.MYSQL_CA_PEM:
        ruta = Path(tempfile.gettempdir()) / "pastoreando_mysql_ca.pem"
        ruta.write_text(config.MYSQL_CA_PEM.replace("\\n", "\n"), encoding="utf-8")
        return str(ruta)
    return None


def abrir_conexion() -> ConexionMySQL:
    """Abre una conexion nueva con los datos de config (variables de entorno)."""
    opciones: dict[str, Any] = {
        "host": config.MYSQL_HOST,
        "port": config.MYSQL_PUERTO,
        "user": config.MYSQL_USUARIO,
        "password": config.MYSQL_CLAVE,
        "database": config.MYSQL_BASE,
        "charset": "utf8mb4",
        "cursorclass": CursorFila,
        "conv": _convertidores(),
        "client_flag": CLIENT.FOUND_ROWS,
        "init_command": "SET SESSION sql_mode=CONCAT(@@sql_mode,',PIPES_AS_CONCAT')",
        "autocommit": False,
    }
    ca = _archivo_ca()
    if ca:
        opciones["ssl_ca"] = ca
    return ConexionMySQL(pymysql.connect(**opciones))


def _sentencias(script: str) -> list[str]:
    """Separa el script en sentencias, quitando los comentarios de linea."""
    sin_comentarios = re.sub(r"--[^\n]*", "", script)
    return [s.strip() for s in sin_comentarios.split(";") if s.strip()]


def crear_tablas(con: ConexionMySQL) -> list[str]:
    """Ejecuta esquema_mysql.sql creando solo las tablas que aun no existen.

    Devuelve los nombres de las tablas que creo (vacio si ya estaban todas).
    """
    existentes = {
        list(fila.values())[0].upper() for fila in con.execute("SHOW TABLES").fetchall()
    }
    creadas = []
    texto = RUTA_ESQUEMA_MYSQL.read_text(encoding="utf-8")
    for sentencia in _sentencias(texto):
        coincidencia = re.match(r"CREATE TABLE\s+(\w+)", sentencia, re.IGNORECASE)
        if coincidencia is None:
            continue
        nombre = coincidencia.group(1)
        if nombre.upper() in existentes:
            continue
        con.execute(sentencia)
        creadas.append(nombre)
    return creadas


def datos_de_conexion() -> str:
    """Descripcion sin secretos de a donde se conecta (para mensajes y logs)."""
    return (
        f"{config.MYSQL_USUARIO}@{config.MYSQL_HOST}:{config.MYSQL_PUERTO}"
        f"/{config.MYSQL_BASE}"
    )


__all__ = [
    "ConexionMySQL",
    "FilaMySQL",
    "abrir_conexion",
    "crear_tablas",
    "datos_de_conexion",
    "traducir_marcadores",
]
