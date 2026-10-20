"""Dependencias de FastAPI: usuario autenticado y control de roles."""

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.domain.errores import CredencialesError
from app.domain.usuario import Actor
from app.services.auth_servicio import AuthServicio

_esquema = HTTPBearer(
    auto_error=False, description="Token JWT obtenido en /api/auth/login"
)


def obtener_actor(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_esquema),
) -> Actor:
    """Lee el token del encabezado Authorization y arma el actor."""
    if credenciales is None:
        raise CredencialesError("Debe iniciar sesión para continuar")
    usuario = AuthServicio().usuario_desde_token(credenciales.credentials)
    nombre = f"{usuario['nombre']} {usuario['apellidos']}"
    return Actor(usuario["id_usuario"], usuario["rol"], nombre)
