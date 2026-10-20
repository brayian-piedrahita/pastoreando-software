"""Roles de usuario y actor que ejecuta una operacion."""

from dataclasses import dataclass

PROPIETARIO = "Propietario"
ARRENDATARIO = "Arrendatario"
TECNICO = "Tecnico"
CONTADOR = "Contador"

# Mismos valores que el ENUM rolUsuario de la tabla USUARIOS (Guia 6).
ROLES = (PROPIETARIO, ARRENDATARIO, TECNICO, CONTADOR)

# La consola local (cli) opera como administrador del equipo, sin sesion.
CONSOLA = "Consola"


@dataclass(frozen=True)
class Actor:
    """Quien ejecuta una operacion: un usuario autenticado o la consola."""

    id_usuario: int
    rol: str
    nombre: str = ""

    @property
    def es_consola(self) -> bool:
        """True si la operacion viene de la consola local."""
        return self.rol == CONSOLA


ACTOR_CONSOLA = Actor(id_usuario=0, rol=CONSOLA, nombre="Consola local")
