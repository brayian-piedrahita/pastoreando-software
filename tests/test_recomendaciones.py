"""Pruebas del servicio de recomendaciones tecnicas (AA5-EV03)."""

import pytest

from app.infrastructure.repositorio_recomendaciones import RepositorioRecomendaciones
from tests.conftest import ARRENDATARIO, OTRO_ARRENDATARIO, TECNICO

OTRO_TECNICO = "camilo.zuluaga@pastoreando.co"
TEXTO_VALIDO = {"descripcion": "Dividir el lote en dos franjas y rotar cada semana."}


def test_listar_recomendaciones(cliente, entrar):
    """CP-N01 | CU-REC | Arrendatario lista las recomendaciones de su hato | 200 y 1"""
    r = cliente.get("/api/ganado/1/recomendaciones", headers=entrar(ARRENDATARIO))
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["nombre_tecnico"] == "Laura Gomez Duque"


def test_listar_recomendaciones_de_hato_ajeno(cliente, entrar):
    """CP-N02 | CU-REC | Arrendatario consulta el hato de otro contrato | 403"""
    r = cliente.get("/api/ganado/1/recomendaciones", headers=entrar(OTRO_ARRENDATARIO))
    assert r.status_code == 403


def test_tecnico_crea_recomendacion(cliente, entrar):
    """CP-N03 | CU-REC | Tecnico registra una recomendacion | 201 con su nombre"""
    r = cliente.post(
        "/api/ganado/1/recomendaciones", json=TEXTO_VALIDO, headers=entrar(TECNICO)
    )
    assert r.status_code == 201
    assert r.json()["nombre_tecnico"] == "Laura Gomez Duque"
    assert r.json()["descripcion"] == TEXTO_VALIDO["descripcion"]


def test_arrendatario_no_crea_recomendacion(cliente, entrar):
    """CP-N04 | CU-REC | Arrendatario intenta registrar una recomendacion | 403"""
    r = cliente.post(
        "/api/ganado/1/recomendaciones", json=TEXTO_VALIDO, headers=entrar(ARRENDATARIO)
    )
    assert r.status_code == 403


@pytest.mark.parametrize(
    "texto",
    ["Corta", "", "<script>alert(1)</script> revisar el lote", "a" * 501, None],
)
def test_recomendacion_texto_invalido(cliente, entrar, texto):
    """CP-N05 | CU-REC | Texto corto, vacio, con etiquetas o de 501 caracteres | 422"""
    r = cliente.post(
        "/api/ganado/1/recomendaciones",
        json={"descripcion": texto},
        headers=entrar(TECNICO),
    )
    assert r.status_code == 422
    assert r.json()["campo"] == "descripcion"


def test_recomendacion_hato_inexistente(cliente, entrar):
    """CP-N06 | CU-REC | Recomendacion sobre un hato que no existe | 404"""
    r = cliente.post(
        "/api/ganado/999/recomendaciones", json=TEXTO_VALIDO, headers=entrar(TECNICO)
    )
    assert r.status_code == 404


def test_solo_el_autor_elimina(cliente, entrar):
    """CP-N07 | CU-REC | Otro tecnico no elimina; el autor si | 403 y luego 204"""
    otro = cliente.delete("/api/recomendaciones/1", headers=entrar(OTRO_TECNICO))
    assert otro.status_code == 403
    autor = cliente.delete("/api/recomendaciones/1", headers=entrar(TECNICO))
    assert autor.status_code == 204
    assert RepositorioRecomendaciones().obtener(1) is None


def test_eliminar_el_hato_elimina_sus_recomendaciones(cliente, entrar):
    """CP-N08 | CU-REC | Se elimina el hato 1 | sus recomendaciones se eliminan"""
    r = cliente.delete("/api/ganado/1", headers=entrar(ARRENDATARIO))
    assert r.status_code == 204
    assert RepositorioRecomendaciones().listar_por_ganado(1) == []
