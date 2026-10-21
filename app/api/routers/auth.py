"""Rutas de autenticacion: registro, inicio de sesion y usuario actual."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.api.dependencias import obtener_actor
from app.api.esquemas import LoginEntrada, RegistroEntrada
from app.domain.errores import CredencialesError
from app.domain.usuario import Actor
from app.services.auth_servicio import AuthServicio

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/registro", status_code=201)
def registrar_usuario(datos: RegistroEntrada) -> dict:
    """Registra un usuario nuevo.

    Propietario y Arrendatario se registran libremente; Tecnico y Contador
    deben enviar ademas el codigo de profesional. Responde 201 con los datos
    del usuario (nunca la contraseña), 409 si la cedula o el correo ya existen,
    422 si algun dato no cumple las reglas y 403 si el codigo es incorrecto.
    """
    usuario = AuthServicio().registrar(
        datos.nombre,
        datos.apellidos,
        datos.cedula,
        datos.rol,
        datos.correo,
        datos.contrasena,
        datos.codigo_profesional,
    )
    return {"mensaje": "Usuario registrado correctamente", "usuario": usuario}


@router.post("/login")
def iniciar_sesion(datos: LoginEntrada):
    """Valida correo y contraseña y entrega el token JWT.

    Si la autenticacion es correcta responde 200 con el mensaje
    "Autenticación satisfactoria"; si no, 401 con "Error en la autenticación".
    El detalle del 401 es el mismo para correo inexistente y clave mala.
    """
    try:
        resultado = AuthServicio().iniciar_sesion(datos.correo, datos.contrasena)
    except CredencialesError as error:
        return JSONResponse(
            status_code=401,
            content={
                "mensaje": "Error en la autenticación",
                "detalle": error.mensaje,
                "campo": None,
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"mensaje": "Autenticación satisfactoria", **resultado}


@router.get("/yo")
def usuario_actual(actor: Actor = Depends(obtener_actor)) -> dict:
    """Devuelve quien tiene la sesion abierta."""
    return {"id_usuario": actor.id_usuario, "rol": actor.rol, "nombre": actor.nombre}
