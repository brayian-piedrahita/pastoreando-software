"""Conexion a la base de datos (SQLite o MySQL/MariaDB).

La clase BaseDatos es un Singleton: toda la aplicacion comparte una unica
configuracion de conexion. Cada operacion abre su propia conexion corta y la
cierra al terminar, para no dejar sesiones abiertas que bloqueen SQLite.

El motor se elige con la variable PASTOREANDO_MOTOR (sqlite por defecto). Con
mysql, la conexion se obtiene de conexion_mysql y se comporta igual que la de
SQLite, asi que los repositorios no saben con cual motor estan trabajando.
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator, Mapping

from app import config

RUTA_ESQUEMA = config.RUTA_BASE / "sql" / "esquema_sqlite.sql"

# Tipo de una fila leida: se accede por nombre de columna con cualquier motor.
FilaBD = Mapping[str, Any]


def _errores_de_integridad() -> tuple[type[Exception], ...]:
    """Errores de llave unica o foranea de cada motor disponible."""
    errores: list[type[Exception]] = [sqlite3.IntegrityError]
    try:
        import pymysql

        errores.append(pymysql.IntegrityError)
    except ImportError:  # instalacion solo con SQLite
        pass
    return tuple(errores)


# Los repositorios capturan esto en lugar de un error propio de un motor.
ErrorIntegridad = _errores_de_integridad()


class BaseDatos:
    """Singleton que entrega conexiones ya configuradas del motor activo."""

    _instancia: "BaseDatos | None" = None

    def __new__(cls) -> "BaseDatos":
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia._ruta = config.RUTA_BD
        return cls._instancia

    @property
    def motor(self) -> str:
        """Motor en uso: sqlite o mysql."""
        return config.MOTOR_BD

    @property
    def ruta(self) -> str:
        """Ruta del archivo SQLite en uso (con mysql no aplica)."""
        return self._ruta

    def configurar(self, ruta: str | Path) -> None:
        """Cambia el archivo SQLite (lo usan las pruebas)."""
        self._ruta = str(ruta)

    @contextmanager
    def conexion(self) -> Iterator[Any]:
        """Abre una conexion, confirma al salir bien y siempre la cierra."""
        if self.motor == "mysql":
            from app.infrastructure.conexion_mysql import abrir_conexion

            con = abrir_conexion()
        else:
            con = sqlite3.connect(self._ruta)
            con.row_factory = sqlite3.Row
            # SQLite no verifica llaves foraneas si no se activa explicitamente.
            con.execute("PRAGMA foreign_keys = ON")
        try:
            yield con
            con.commit()
        except Exception:
            con.rollback()
            raise
        finally:
            con.close()


def obtener_bd() -> BaseDatos:
    """Devuelve la instancia unica de BaseDatos."""
    return BaseDatos()


def iniciar_bd() -> None:
    """Crea las tablas que todavia no existen en el motor activo."""
    bd = obtener_bd()
    if bd.motor == "mysql":
        from app.infrastructure.conexion_mysql import crear_tablas

        with bd.conexion() as con:
            crear_tablas(con)
        return
    ruta = Path(bd.ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    esquema = RUTA_ESQUEMA.read_text(encoding="utf-8")
    with bd.conexion() as con:
        con.executescript(esquema)
