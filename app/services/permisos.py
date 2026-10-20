"""Verificacion de permisos por rol, compartida por todos los servicios."""

from app.domain.errores import AccesoDenegadoError
from app.domain.usuario import Actor


def exigir_roles(actor: Actor, *roles: str) -> None:
    """Lanza AccesoDenegadoError si el actor no tiene alguno de los roles.

    La consola local siempre pasa: opera como administrador del equipo.
    """
    if actor.es_consola or actor.rol in roles:
        return
    raise AccesoDenegadoError("Su rol no tiene permiso para esta operación")
