"""Pruebas de la firma del contrato por las dos partes (AA5-EV03, RF05)."""

import pytest

from tests.conftest import (
    ARRENDATARIO,
    CONTADOR,
    OTRO_ARRENDATARIO,
    OTRO_PROPIETARIO,
    PROPIETARIO,
    TECNICO,
)


def test_arrendatario_firma(cliente, entrar):
    """CP-F01 | RF05 | Arrendatario firma el contrato 1 | 201, una firma vigente"""
    r = cliente.post("/api/contratos/1/firma", headers=entrar(ARRENDATARIO))
    assert r.status_code == 201
    cuerpo = r.json()
    assert len(cuerpo["firmas"]) == 1
    assert cuerpo["firmas"][0]["rol_firmante"] == "Arrendatario"
    assert cuerpo["firmas"][0]["vigente"] is True
    assert len(cuerpo["firmas"][0]["huella_documento"]) == 64
    assert cuerpo["firmado_por_ambas_partes"] is False


def test_firman_las_dos_partes(cliente, entrar):
    """CP-F02 | RF05 | Arrendatario y propietario firman | firmado por ambas partes"""
    cliente.post("/api/contratos/1/firma", headers=entrar(ARRENDATARIO))
    r = cliente.post("/api/contratos/1/firma", headers=entrar(PROPIETARIO))
    assert r.status_code == 201
    assert r.json()["firmado_por_ambas_partes"] is True


def test_no_se_firma_dos_veces(cliente, entrar):
    """CP-F03 | RF05 | La misma persona firma dos veces | 409"""
    cliente.post("/api/contratos/1/firma", headers=entrar(ARRENDATARIO))
    r = cliente.post("/api/contratos/1/firma", headers=entrar(ARRENDATARIO))
    assert r.status_code == 409


@pytest.mark.parametrize("correo", [TECNICO, CONTADOR])
def test_rol_sin_firma(cliente, entrar, correo):
    """CP-F04 | RF05 | Tecnico o contador intentan firmar | 403"""
    r = cliente.post("/api/contratos/1/firma", headers=entrar(correo))
    assert r.status_code == 403


@pytest.mark.parametrize("correo", [OTRO_PROPIETARIO, OTRO_ARRENDATARIO])
def test_firma_de_contrato_ajeno(cliente, entrar, correo):
    """CP-F05 | RF05 | Usuario ajeno al contrato 1 intenta firmar | 403"""
    r = cliente.post("/api/contratos/1/firma", headers=entrar(correo))
    assert r.status_code == 403


def test_contrato_sin_ganado_no_se_firma(cliente, entrar):
    """CP-F06 | RF05 | Contrato nuevo sin ganado | 409 (no hay texto que firmar)"""
    nuevo = cliente.post(
        "/api/contratos",
        json={
            "id_lote": 4,
            "fecha_inicio": "2026-11-01",
            "meses_duracion": 3,
            "tarifa_por_cabeza": 80000,
        },
        headers=entrar(ARRENDATARIO),
    )
    assert nuevo.status_code == 201
    id_nuevo = nuevo.json()["id_contrato"]
    r = cliente.post(f"/api/contratos/{id_nuevo}/firma", headers=entrar(ARRENDATARIO))
    assert r.status_code == 409


def test_contrato_finalizado_no_se_firma(cliente, entrar):
    """CP-F07 | RF05 | Contrato 4 en estado Finalizado | 409"""
    r = cliente.post("/api/contratos/4/firma", headers=entrar(OTRO_ARRENDATARIO))
    assert r.status_code == 409


def test_firma_pierde_vigencia_si_cambia_el_ganado(cliente, entrar):
    """CP-F08 | RF05 | Se agrega un hato despues de firmar | la firma deja de ser vigente"""
    cliente.post("/api/contratos/1/firma", headers=entrar(ARRENDATARIO))
    cliente.post(
        "/api/contratos/1/ganado",
        json={"raza": "Nelore", "cantidad_cabezas": 1, "proposito": "Carne"},
        headers=entrar(ARRENDATARIO),
    )
    r = cliente.get("/api/contratos/1/firmas", headers=entrar(ARRENDATARIO))
    assert r.status_code == 200
    assert r.json()["firmas"][0]["vigente"] is False
    assert r.json()["firmado_por_ambas_partes"] is False


def test_consultar_firmas_de_contrato_ajeno(cliente, entrar):
    """CP-F09 | RF05 | Otro arrendatario consulta las firmas del contrato 1 | 403"""
    r = cliente.get("/api/contratos/1/firmas", headers=entrar(OTRO_ARRENDATARIO))
    assert r.status_code == 403
