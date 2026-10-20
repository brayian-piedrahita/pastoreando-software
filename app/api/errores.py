"""Traduccion de errores del dominio a respuestas HTTP."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.domain.errores import (
    AccesoDenegadoError,
    ConflictoError,
    CredencialesError,
    ErrorPastoreando,
    NoEncontradoError,
    ValidacionError,
)

CODIGOS = {
    ValidacionError: 422,
    NoEncontradoError: 404,
    ConflictoError: 409,
    AccesoDenegadoError: 403,
    CredencialesError: 401,
}


def _respuesta(codigo: int, detalle: str, campo: str | None = None) -> JSONResponse:
    cuerpo = {"detalle": detalle, "campo": campo}
    cabeceras = {"WWW-Authenticate": "Bearer"} if codigo == 401 else None
    return JSONResponse(status_code=codigo, content=cuerpo, headers=cabeceras)


def registrar_manejadores(app: FastAPI) -> None:
    """Conecta los errores controlados con su codigo HTTP."""

    @app.exception_handler(ErrorPastoreando)
    async def manejar_dominio(_: Request, error: ErrorPastoreando) -> JSONResponse:
        codigo = CODIGOS.get(type(error), 400)
        return _respuesta(codigo, error.mensaje, error.campo)

    @app.exception_handler(RequestValidationError)
    async def manejar_formato(_: Request, __: RequestValidationError) -> JSONResponse:
        return _respuesta(
            422,
            "La solicitud no tiene un formato JSON válido o trae campos desconocidos",
        )
