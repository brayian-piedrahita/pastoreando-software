"""Excepciones del dominio.

Cada una se traduce a un codigo HTTP en la capa api (ver api/errores.py).
"""


class ErrorPastoreando(Exception):
    """Base de todos los errores controlados de la aplicacion."""

    def __init__(self, mensaje: str, campo: str | None = None) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.campo = campo


class ValidacionError(ErrorPastoreando):
    """Un dato no cumple una regla de negocio (HTTP 422)."""


class NoEncontradoError(ErrorPastoreando):
    """El registro solicitado no existe (HTTP 404)."""


class ConflictoError(ErrorPastoreando):
    """La operacion choca con el estado actual de los datos (HTTP 409)."""


class AccesoDenegadoError(ErrorPastoreando):
    """El usuario no tiene permiso sobre el recurso (HTTP 403)."""


class CredencialesError(ErrorPastoreando):
    """Usuario o contrasena incorrectos, o token invalido (HTTP 401)."""
