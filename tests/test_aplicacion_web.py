"""Pruebas de la entrega de la aplicacion React desde el servidor (GA8-AA1-EV02)."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.archivos_aplicacion import ArchivosAplicacion


@pytest.fixture()
def aplicacion(tmp_path):
    """Un build de React de mentira: index.html y un archivo en assets."""
    (tmp_path / "index.html").write_text(
        "<html>pastoreando-spa</html>", encoding="utf-8"
    )
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log(1)", encoding="utf-8")
    app = FastAPI()
    app.mount("/", ArchivosAplicacion(directory=tmp_path, html=True))
    return TestClient(app)


def test_la_raiz_entrega_index(aplicacion):
    """CP-V01 | Despliegue | GET / | index.html de la aplicacion"""
    r = aplicacion.get("/")
    assert r.status_code == 200
    assert "pastoreando-spa" in r.text


def test_un_archivo_existente_se_entrega_tal_cual(aplicacion):
    """CP-V02 | Despliegue | GET /assets/app.js | el archivo, no index.html"""
    r = aplicacion.get("/assets/app.js")
    assert r.status_code == 200
    assert r.text == "console.log(1)"


def test_una_ruta_del_cliente_devuelve_index(aplicacion):
    """CP-V03 | Despliegue | Recargar /contratos/3 | index.html para que React resuelva la ruta"""
    r = aplicacion.get("/contratos/3")
    assert r.status_code == 200
    assert "pastoreando-spa" in r.text


def test_un_archivo_con_extension_que_no_existe_da_404(aplicacion):
    """CP-V04 | Despliegue | GET /assets/falta.js | 404, no index.html"""
    assert aplicacion.get("/assets/falta.js").status_code == 404


def test_una_ruta_de_api_inexistente_da_404(aplicacion):
    """CP-V05 | Despliegue | GET /api/nada | 404, no index.html"""
    assert aplicacion.get("/api/nada").status_code == 404


def test_la_ruta_de_salud_responde_ok(cliente):
    """CP-V06 | Despliegue | GET /api/salud | estado ok sin sesion"""
    r = cliente.get("/api/salud")
    assert r.status_code == 200
    assert r.json() == {"estado": "ok"}
