"""Punto de entrada de la aplicacion web de Pastoreando.

Ejecutar con:  python -m uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import config
from app.api.errores import registrar_manejadores
from app.api.routers import auth, contratos, costos, lotes
from app.infrastructure.datos_prueba import cargar_datos_prueba
from app.infrastructure.db import iniciar_bd


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    """Al arrancar: crea las tablas y carga los datos de prueba si esta vacia."""
    iniciar_bd()
    cargar_datos_prueba()
    yield


app = FastAPI(
    title="Pastoreando",
    description="Arrendamiento de lotes para pastoreo de ganado bovino.",
    version="1.0.0",
    lifespan=ciclo_de_vida,
)
registrar_manejadores(app)
for modulo in (auth, lotes, contratos, costos):
    app.include_router(modulo.router)

# El frontend se sirve desde la raiz para que el service worker cubra toda la PWA.
app.mount(
    "/",
    StaticFiles(directory=config.RUTA_BASE / "frontend", html=True),
    name="frontend",
)
