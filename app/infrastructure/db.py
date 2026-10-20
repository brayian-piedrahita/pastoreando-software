"""Conexion a la base de datos SQLite.

La clase BaseDatos es un Singleton: toda la aplicacion comparte una unica
configuracion de conexion. Cada operacion abre su propia conexion corta y la
cierra al terminar, para no dejar sesiones abiertas que bloqueen SQLite.
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from app import config

RUTA_ESQUEMA = config.RUTA_BASE / "sql" / "esquema_sqlite.sql"


class BaseDatos:
    """Singleton que entrega conexiones SQLite ya configuradas."""

    _instancia: "BaseDatos | None" = None

    def __new__(cls) -> "BaseDatos":
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia._ruta = config.RUTA_BD
        return cls._instancia

    @property
    def ruta(self) -> str:
        """Ruta del archivo de base de datos en uso."""
        return self._ruta

    def configurar(self, ruta: str | Path) -> None:
        """Cambia el archivo de base de datos (lo usan las pruebas)."""
        self._ruta = str(ruta)

    @contextmanager
    def conexion(self) -> Iterator[sqlite3.Connection]:
        """Abre una conexion, confirma al salir bien y siempre la cierra."""
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
    """Crea la carpeta y las tablas si todavia no existen."""
    ruta = Path(obtener_bd().ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    esquema = RUTA_ESQUEMA.read_text(encoding="utf-8")
    with obtener_bd().conexion() as con:
        con.executescript(esquema)
