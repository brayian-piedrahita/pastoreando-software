"""Pruebas del reporte de rentabilidad (AA5-EV03, RF06)."""

import pytest

from tests.conftest import (
    ARRENDATARIO,
    CONTADOR,
    OTRO_PROPIETARIO,
    PROPIETARIO,
    TECNICO,
)


def _por_contrato(cuerpo: dict) -> dict:
    return {c["id_contrato"]: c for c in cuerpo["contratos"]}


def test_propietario_ve_solo_sus_contratos(cliente, entrar):
    """CP-T01 | RF06 | Propietario Carlos consulta el reporte | contratos 1 y 2"""
    r = cliente.get("/api/reportes/rentabilidad", headers=entrar(PROPIETARIO))
    assert r.status_code == 200
    assert set(_por_contrato(r.json())) == {1, 2}


def test_contador_ve_todos_los_contratos(cliente, entrar):
    """CP-T02 | RF06 | Contador consulta el reporte | los cinco contratos"""
    r = cliente.get("/api/reportes/rentabilidad", headers=entrar(CONTADOR))
    assert r.status_code == 200
    assert set(_por_contrato(r.json())) == {1, 2, 3, 4, 5}


def test_valores_del_contrato_1(cliente, entrar):
    """CP-T03 | RF06 | Contrato 1 con margen del 20 % | ingreso 13.260.000, utilidad 2.210.000"""
    r = cliente.get("/api/reportes/rentabilidad", headers=entrar(PROPIETARIO))
    c1 = _por_contrato(r.json())[1]
    assert r.json()["margen_utilidad"] == 0.2
    assert c1["ingreso_total"] == 13_260_000
    assert c1["costo_estimado"] == 11_050_000
    assert c1["utilidad_proyectada"] == 2_210_000
    assert c1["recaudado"] == 2_210_000
    assert c1["saldo_por_cobrar"] == 11_050_000


def test_totales_suman_los_contratos(cliente, entrar):
    """CP-T04 | RF06 | Los totales | son la suma de cada columna"""
    r = cliente.get("/api/reportes/rentabilidad", headers=entrar(CONTADOR))
    cuerpo = r.json()
    for campo, total in cuerpo["totales"].items():
        assert total == round(sum(c[campo] for c in cuerpo["contratos"]), 2)


@pytest.mark.parametrize("correo", [ARRENDATARIO, TECNICO])
def test_reporte_rol_no_autorizado(cliente, entrar, correo):
    """CP-T05 | RF06 | Arrendatario o tecnico piden el reporte | 403"""
    r = cliente.get("/api/reportes/rentabilidad", headers=entrar(correo))
    assert r.status_code == 403


def test_pago_confirmado_actualiza_el_recaudo(cliente, entrar):
    """CP-T06 | RF06 | Se confirma el pago 2 | recaudado 4.420.000 y saldo 8.840.000"""
    cliente.put(
        "/api/pagos/2/estado",
        json={"estado_pago": "Confirmado"},
        headers=entrar(PROPIETARIO),
    )
    r = cliente.get("/api/reportes/rentabilidad", headers=entrar(PROPIETARIO))
    c1 = _por_contrato(r.json())[1]
    assert c1["recaudado"] == 4_420_000
    assert c1["saldo_por_cobrar"] == 8_840_000


def test_otro_propietario_no_ve_contratos_ajenos(cliente, entrar):
    """CP-T07 | RF06 | Propietario Marta consulta el reporte | contratos 3, 4 y 5"""
    r = cliente.get("/api/reportes/rentabilidad", headers=entrar(OTRO_PROPIETARIO))
    assert set(_por_contrato(r.json())) == {3, 4, 5}


def test_reporte_sin_sesion(cliente):
    """CP-T08 | RF06 | Reporte sin token | 401"""
    assert cliente.get("/api/reportes/rentabilidad").status_code == 401
