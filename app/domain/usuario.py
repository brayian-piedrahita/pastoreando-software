"""Roles de usuario y actor que ejecuta una operacion."""

from dataclasses import dataclass

from app.domain.validaciones import (
    PATRON_LETRAS,
    validar_cedula,
    validar_contrasena_nueva,
    validar_correo,
    validar_opcion,
    validar_texto,
)

PROPIETARIO = "Propietario"
ARRENDATARIO = "Arrendatario"
TECNICO = "Tecnico"
CONTADOR = "Contador"

# Mismos valores que el ENUM rolUsuario de la tabla USUARIOS (Guia 6).
ROLES = (PROPIETARIO, ARRENDATARIO, TECNICO, CONTADOR)

# Roles que cualquier persona puede elegir al registrarse. Los profesionales
# adjuntos (Tecnico y Contador) necesitan ademas el codigo de invitacion.
ROLES_REGISTRO_LIBRE = (PROPIETARIO, ARRENDATARIO)
ROLES_PROFESIONALES = (TECNICO, CONTADOR)

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


@dataclass(frozen=True)
class NuevoUsuario:
    """Datos ya validados de una persona que se registra."""

    nombre: str
    apellidos: str
    cedula: str
    rol: str
    correo: str
    contrasena: str

    @property
    def es_profesional(self) -> bool:
        """True si el rol exige el codigo de invitacion."""
        return self.rol in ROLES_PROFESIONALES


def validar_nuevo_usuario(
    nombre: object,
    apellidos: object,
    cedula: object,
    rol: object,
    correo: object,
    contrasena: object,
) -> NuevoUsuario:
    """Valida todos los datos del registro y los devuelve limpios.

    Se detiene en el primer dato invalido, igual que el resto del dominio, para
    que la web, la consola y las pruebas reciban el mismo mensaje.
    """
    return NuevoUsuario(
        nombre=validar_texto(nombre, "nombre", 2, 50, PATRON_LETRAS),
        apellidos=validar_texto(apellidos, "apellidos", 2, 60, PATRON_LETRAS),
        cedula=validar_cedula(cedula),
        rol=validar_opcion(rol, "rol", ROLES),
        correo=validar_correo(correo),
        contrasena=validar_contrasena_nueva(contrasena),
    )
