"""Pruebas del modulo de lotes (CU-LOT) y de la alerta de carga (RF04)."""

from tests.conftest import ARRENDATARIO, OTRO_PROPIETARIO, PROPIETARIO, TECNICO


def test_listar_lotes_con_estado_de_carga(cliente, entrar):
    """CP-LT01 | RF04 | Listar lotes de la Guia 6 | 4 lotes: ALERTA, SOBRECARGA, ALERTA, NORMAL"""
    r = cliente.get("/api/lotes", headers=entrar(TECNICO))
    assert r.status_code == 200
    niveles = [lote["estado_carga"]["nivel"] for lote in r.json()]
    assert niveles == ["ALERTA", "SOBRECARGA", "ALERTA", "NORMAL"]


def test_crear_lote(cliente, entrar, lote_valido):
    """CP-LT02 | CU-LOT | Propietario crea un lote valido | 201 y queda a su nombre"""
    r = cliente.post("/api/lotes", json=lote_valido, headers=entrar(PROPIETARIO))
    assert r.status_code == 201
    assert r.json()["id_propietario"] == 1
    assert r.json()["estado_carga"]["nivel"] == "NORMAL"


def test_crear_lote_arrendatario_no_puede(cliente, entrar, lote_valido):
    """CP-LT03 | CU-LOT | Arrendatario intenta crear un lote | 403"""
    r = cliente.post("/api/lotes", json=lote_valido, headers=entrar(ARRENDATARIO))
    assert r.status_code == 403


def test_crear_lote_hectareas_cero(cliente, entrar, lote_valido):
    """CP-LT04 | CU-LOT | Hectareas = 0 | 422 en el campo hectareas"""
    lote_valido["hectareas"] = 0
    r = cliente.post("/api/lotes", json=lote_valido, headers=entrar(PROPIETARIO))
    assert r.status_code == 422
    assert r.json()["campo"] == "hectareas"


def test_crear_lote_capacidad_negativa(cliente, entrar, lote_valido):
    """CP-LT05 | CU-LOT | Capacidad de carga = -5 | 422 en el campo capacidad_carga"""
    lote_valido["capacidad_carga"] = -5
    r = cliente.post("/api/lotes", json=lote_valido, headers=entrar(PROPIETARIO))
    assert r.status_code == 422
    assert r.json()["campo"] == "capacidad_carga"


def test_crear_lote_nombre_con_caracteres_especiales(cliente, entrar, lote_valido):
    """CP-LT06 | CU-LOT | Nombre '<b>Lote</b>' | 422 por caracteres no permitidos"""
    lote_valido["nombre_lote"] = "<b>Lote</b>"
    r = cliente.post("/api/lotes", json=lote_valido, headers=entrar(PROPIETARIO))
    assert r.status_code == 422
    assert "no permitidos" in r.json()["detalle"]


def test_crear_lote_nombre_muy_largo(cliente, entrar, lote_valido):
    """CP-LT07 | CU-LOT | Nombre de 51 caracteres | 422 por longitud"""
    lote_valido["nombre_lote"] = "L" * 51
    r = cliente.post("/api/lotes", json=lote_valido, headers=entrar(PROPIETARIO))
    assert r.status_code == 422
    assert "50" in r.json()["detalle"]


def test_crear_lote_campos_faltantes(cliente, entrar):
    """CP-LT08 | CU-LOT | Cuerpo vacio {} | 422 (nombre obligatorio)"""
    r = cliente.post("/api/lotes", json={}, headers=entrar(PROPIETARIO))
    assert r.status_code == 422


def test_crear_lote_campo_desconocido(cliente, entrar, lote_valido):
    """CP-LT09 | CU-LOT | Cuerpo con campo 'color' no definido | 422"""
    lote_valido["color"] = "verde"
    r = cliente.post("/api/lotes", json=lote_valido, headers=entrar(PROPIETARIO))
    assert r.status_code == 422


def test_actualizar_lote_propio(cliente, entrar):
    """CP-LT10 | CU-LOT | Propietario sube la capacidad del lote 2 de 20 a 28 (24 cabezas) | 200 y la alerta pasa de SOBRECARGA a ALERTA"""
    r = cliente.put(
        "/api/lotes/2", json={"capacidad_carga": 28}, headers=entrar(PROPIETARIO)
    )
    assert r.status_code == 200
    assert r.json()["capacidad_carga"] == 28
    assert r.json()["estado_carga"]["nivel"] == "ALERTA"


def test_actualizar_lote_ajeno(cliente, entrar):
    """CP-LT11 | CU-LOT | Otro propietario edita el lote 1 | 403"""
    r = cliente.put(
        "/api/lotes/1", json={"capacidad_carga": 99}, headers=entrar(OTRO_PROPIETARIO)
    )
    assert r.status_code == 403


def test_lote_inexistente(cliente, entrar):
    """CP-LT12 | CU-LOT | GET /api/lotes/999 | 404"""
    assert cliente.get("/api/lotes/999", headers=entrar(PROPIETARIO)).status_code == 404


def test_eliminar_lote_sin_contratos(cliente, entrar, lote_valido):
    """CP-LT13 | CU-LOT | Eliminar un lote recien creado | 204 y luego 404"""
    h = entrar(PROPIETARIO)
    nuevo = cliente.post("/api/lotes", json=lote_valido, headers=h).json()["id_lote"]
    assert cliente.delete(f"/api/lotes/{nuevo}", headers=h).status_code == 204
    assert cliente.get(f"/api/lotes/{nuevo}", headers=h).status_code == 404


def test_eliminar_lote_con_contratos(cliente, entrar):
    """CP-LT14 | CU-LOT | Eliminar el lote 1 que tiene contratos (FK RESTRICT) | 409"""
    r = cliente.delete("/api/lotes/1", headers=entrar(PROPIETARIO))
    assert r.status_code == 409
    assert "contratos" in r.json()["detalle"]
