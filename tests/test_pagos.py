"""Pruebas del servicio de pagos de un contrato (AA5-EV03)."""

import pytest

from tests.conftest import (
    ARRENDATARIO,
    CONTADOR,
    OTRO_ARRENDATARIO,
    OTRO_PROPIETARIO,
    PROPIETARIO,
    TECNICO,
)

PAGO_VALIDO = {
    "fecha_pago": "2026-11-01",
    "monto_total": 2210000,
    "metodo_pago": "Transferencia",
}


def test_listar_pagos_del_contrato(cliente, entrar):
    """CP-P01 | CU-PAG | Arrendatario lista los pagos de su contrato | 200 y 2 pagos"""
    r = cliente.get("/api/contratos/1/pagos", headers=entrar(ARRENDATARIO))
    assert r.status_code == 200
    assert [p["estado_pago"] for p in r.json()] == ["Confirmado", "Pendiente"]


def test_listar_pagos_de_contrato_ajeno(cliente, entrar):
    """CP-P02 | CU-PAG | Otro arrendatario consulta el contrato 1 | 403"""
    r = cliente.get("/api/contratos/1/pagos", headers=entrar(OTRO_ARRENDATARIO))
    assert r.status_code == 403


def test_registrar_pago(cliente, entrar):
    """CP-P03 | CU-PAG | Arrendatario registra un pago valido | 201 en estado Pendiente"""
    r = cliente.post(
        "/api/contratos/1/pagos", json=PAGO_VALIDO, headers=entrar(ARRENDATARIO)
    )
    assert r.status_code == 201
    assert r.json()["estado_pago"] == "Pendiente"
    assert r.json()["monto_total"] == 2210000


@pytest.mark.parametrize("correo", [PROPIETARIO, TECNICO, CONTADOR])
def test_registrar_pago_rol_no_autorizado(cliente, entrar, correo):
    """CP-P04 | CU-PAG | Propietario, tecnico o contador registran un pago | 403"""
    r = cliente.post("/api/contratos/1/pagos", json=PAGO_VALIDO, headers=entrar(correo))
    assert r.status_code == 403


def test_registrar_pago_en_contrato_de_otro(cliente, entrar):
    """CP-P05 | CU-PAG | Arrendatario paga un contrato que no es suyo | 403"""
    r = cliente.post(
        "/api/contratos/1/pagos", json=PAGO_VALIDO, headers=entrar(OTRO_ARRENDATARIO)
    )
    assert r.status_code == 403


def test_registrar_pago_en_contrato_finalizado(cliente, entrar):
    """CP-P06 | CU-PAG | Pago sobre un contrato Finalizado | 409"""
    r = cliente.post(
        "/api/contratos/4/pagos", json=PAGO_VALIDO, headers=entrar(OTRO_ARRENDATARIO)
    )
    assert r.status_code == 409


@pytest.mark.parametrize(
    "campo,valor",
    [
        ("monto_total", 0),
        ("monto_total", -5000),
        ("monto_total", "abc"),
        ("monto_total", 1e30),
        ("fecha_pago", "2026-02-30"),
        ("fecha_pago", "01/11/2026"),
        ("fecha_pago", None),
        ("metodo_pago", "Bitcoin"),
    ],
)
def test_registrar_pago_datos_invalidos(cliente, entrar, campo, valor):
    """CP-P07 | CU-PAG | Monto, fecha o metodo fuera de regla | 422 en el campo"""
    datos = {**PAGO_VALIDO, campo: valor}
    r = cliente.post("/api/contratos/1/pagos", json=datos, headers=entrar(ARRENDATARIO))
    assert r.status_code == 422
    assert r.json()["campo"] == campo


def test_propietario_confirma_pago_pendiente(cliente, entrar):
    """CP-P08 | CU-PAG | Propietario del lote confirma el pago 2 | 200 Confirmado"""
    r = cliente.put(
        "/api/pagos/2/estado",
        json={"estado_pago": "Confirmado"},
        headers=entrar(PROPIETARIO),
    )
    assert r.status_code == 200
    assert r.json()["estado_pago"] == "Confirmado"


def test_propietario_de_otro_lote_no_resuelve(cliente, entrar):
    """CP-P09 | CU-PAG | Propietario de otro lote intenta resolver el pago 2 | 403"""
    r = cliente.put(
        "/api/pagos/2/estado",
        json={"estado_pago": "Confirmado"},
        headers=entrar(OTRO_PROPIETARIO),
    )
    assert r.status_code == 403


def test_arrendatario_no_resuelve_pagos(cliente, entrar):
    """CP-P10 | CU-PAG | Arrendatario intenta confirmar su propio pago | 403"""
    r = cliente.put(
        "/api/pagos/2/estado",
        json={"estado_pago": "Confirmado"},
        headers=entrar(ARRENDATARIO),
    )
    assert r.status_code == 403


def test_pago_ya_resuelto_no_cambia(cliente, entrar):
    """CP-P11 | CU-PAG | Cambiar el estado de un pago ya confirmado | 409"""
    r = cliente.put(
        "/api/pagos/1/estado",
        json={"estado_pago": "Rechazado"},
        headers=entrar(PROPIETARIO),
    )
    assert r.status_code == 409


@pytest.mark.parametrize("estado", ["Pendiente", "Pagado", "", None])
def test_estado_de_resolucion_invalido(cliente, entrar, estado):
    """CP-P12 | CU-PAG | Estado fuera de Confirmado o Rechazado | 422"""
    r = cliente.put(
        "/api/pagos/2/estado",
        json={"estado_pago": estado},
        headers=entrar(PROPIETARIO),
    )
    assert r.status_code == 422


def test_pago_inexistente(cliente, entrar):
    """CP-P13 | CU-PAG | Resolver un pago que no existe | 404"""
    r = cliente.put(
        "/api/pagos/999/estado",
        json={"estado_pago": "Confirmado"},
        headers=entrar(CONTADOR),
    )
    assert r.status_code == 404


def test_contador_rechaza_pago(cliente, entrar):
    """CP-P14 | CU-PAG | Contador rechaza el pago 2 | 200 Rechazado"""
    r = cliente.put(
        "/api/pagos/2/estado",
        json={"estado_pago": "Rechazado"},
        headers=entrar(CONTADOR),
    )
    assert r.status_code == 200
    assert r.json()["estado_pago"] == "Rechazado"


def test_pagos_sin_sesion(cliente):
    """CP-P15 | CU-PAG | Consultar pagos sin token | 401"""
    assert cliente.get("/api/contratos/1/pagos").status_code == 401
