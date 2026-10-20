"""Rutas de autenticacion."""

from fastapi import APIRouter, Depends

from app.api.dependencias import obtener_actor
from app.api.esquemas import LoginEntrada
from app.domain.usuario import Actor
from app.services.auth_servicio import AuthServicio

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login")
def iniciar_sesion(datos: LoginEntrada) -> dict:
    """Valida correo y contraseña y entrega el token JWT."""
    return AuthServicio().iniciar_sesion(datos.correo, datos.contrasena)


@router.get("/yo")
def usuario_actual(actor: Actor = Depends(obtener_actor)) -> dict:
    """Devuelve quien tiene la sesion abierta."""
    return {"id_usuario": actor.id_usuario, "rol": actor.rol, "nombre": actor.nombre}
