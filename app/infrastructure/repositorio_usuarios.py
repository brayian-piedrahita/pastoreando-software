"""Acceso a datos de la tabla USUARIOS."""

from app.domain.errores import ConflictoError
from app.infrastructure.db import ErrorIntegridad, FilaBD, obtener_bd


def _a_dict(fila: FilaBD) -> dict:
    """Traduce una fila (columnas camelCase) a un diccionario snake_case."""
    return {
        "id_usuario": fila["idUsuario"],
        "nombre": fila["nombre"],
        "apellidos": fila["apellidos"],
        "cedula": fila["cedula"],
        "rol": fila["rolUsuario"],
        "correo": fila["correo"],
    }


class RepositorioUsuarios:
    """Consultas sobre usuarios. Todas usan marcadores ? (sin concatenar)."""

    def buscar_credenciales(self, correo: str) -> dict | None:
        """Devuelve el usuario con su hash de contrasena, o None si no existe."""
        with obtener_bd().conexion() as con:
            fila = con.execute(
                "SELECT * FROM USUARIOS WHERE correo = ?", (correo,)
            ).fetchone()
        if fila is None:
            return None
        datos = _a_dict(fila)
        datos["contrasena"] = fila["contrasena"]
        return datos

    def obtener(self, id_usuario: int) -> dict | None:
        """Devuelve un usuario por su id, sin la contrasena."""
        with obtener_bd().conexion() as con:
            fila = con.execute(
                "SELECT * FROM USUARIOS WHERE idUsuario = ?", (id_usuario,)
            ).fetchone()
        return _a_dict(fila) if fila else None

    def contar(self) -> int:
        """Cantidad de usuarios registrados."""
        with obtener_bd().conexion() as con:
            return con.execute("SELECT COUNT(*) FROM USUARIOS").fetchone()[0]

    def crear(
        self,
        nombre: str,
        apellidos: str,
        cedula: str,
        rol: str,
        correo: str,
        hash_contrasena: str,
    ) -> int:
        """Inserta un usuario y devuelve su id."""
        try:
            with obtener_bd().conexion() as con:
                cursor = con.execute(
                    "INSERT INTO USUARIOS "
                    "(nombre, apellidos, cedula, rolUsuario, correo, contrasena) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (nombre, apellidos, cedula, rol, correo, hash_contrasena),
                )
                return cursor.lastrowid
        except ErrorIntegridad:
            raise ConflictoError("La cédula o el correo ya están registrados")
