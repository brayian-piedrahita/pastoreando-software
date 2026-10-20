"""Configuracion comun de las pruebas.

Cada prueba trabaja con su propia base SQLite temporal, cargada con los datos
de la Guia 6, para que ninguna dependa del resultado de otra.
"""

import os

# Debe fijarse antes de importar la aplicacion: baja el costo del hash bcrypt.
os.environ["PASTOREANDO_BCRYPT_RONDAS"] = "4"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import config  # noqa: E402
from app.infrastructure.datos_prueba import cargar_datos_prueba  # noqa: E402
from app.infrastructure.db import iniciar_bd, obtener_bd  # noqa: E402
from app.main import app  # noqa: E402

CLAVE = config.CLAVE_USUARIOS_PRUEBA
PROPIETARIO = "carlos.ramirez@pastoreando.co"
OTRO_PROPIETARIO = "marta.restrepo@pastoreando.co"
ARRENDATARIO = "brayian.piedrahita@pastoreando.co"
OTRO_ARRENDATARIO = "jhon.osorio@pastoreando.co"
TECNICO = "laura.gomez@pastoreando.co"
CONTADOR = "sandra.bedoya@pastoreando.co"


@pytest.fixture()
def cliente(tmp_path):
    """Cliente HTTP sobre una base de datos nueva con los datos de prueba."""
    obtener_bd().configurar(tmp_path / "prueba.db")
    iniciar_bd()
    cargar_datos_prueba()
    with TestClient(app) as http:
        yield http


@pytest.fixture()
def entrar(cliente):
    """Devuelve una funcion que inicia sesion y entrega los encabezados."""

    def _entrar(correo: str) -> dict:
        respuesta = cliente.post(
            "/api/auth/login", json={"correo": correo, "contrasena": CLAVE}
        )
        assert respuesta.status_code == 200
        return {"Authorization": f"Bearer {respuesta.json()['token']}"}

    return _entrar


@pytest.fixture()
def lote_valido() -> dict:
    """Datos correctos para crear un lote."""
    return {
        "nombre_lote": "Potrero El Roble",
        "hectareas": 10.5,
        "capacidad_carga": 25,
        "tipo_pastura": "Brachiaria",
    }


@pytest.fixture()
def costo_valido() -> dict:
    """Datos correctos para calcular un costo (ejemplo del analisis)."""
    return {
        "alimentacion": 6_000_000,
        "mantenimiento": 3_000_000,
        "servicios": 1_500_000,
        "impuestos": 1_500_000,
        "cantidad_animales": 50,
        "proposito": "Carne",
    }
