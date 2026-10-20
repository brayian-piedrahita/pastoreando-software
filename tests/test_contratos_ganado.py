"""Pruebas de contratos (RF05), ganado (CU-GAN) y documento del contrato (RF05)."""

from tests.conftest import (
    ARRENDATARIO,
    CONTADOR,
    OTRO_ARRENDATARIO,
    OTRO_PROPIETARIO,
    PROPIETARIO,
)


def _contrato_nuevo(**cambios) -> dict:
    datos = {
        "id_lote": 4,
        "fecha_inicio": "2026-11-01",
        "meses_duracion": 6,
        "tarifa_por_cabeza": 80_000,
    }
    datos.update(cambios)
    return datos


# ------------------------------- Contratos -------------------------------
def test_arrendatario_solo_ve_sus_contratos(cliente, entrar):
    """CP-C01 | RF05 | Brayian (arrendatario) lista contratos | Solo los suyos (1 y 5)"""
    r = cliente.get("/api/contratos", headers=entrar(ARRENDATARIO))
    assert sorted(c["id_contrato"] for c in r.json()) == [1, 5]


def test_propietario_solo_ve_contratos_de_sus_lotes(cliente, entrar):
    """CP-C02 | RF05 | Carlos (propietario) lista contratos | Los de sus lotes 1 y 2"""
    r = cliente.get("/api/contratos", headers=entrar(PROPIETARIO))
    assert sorted(c["id_contrato"] for c in r.json()) == [1, 2]


def test_contador_ve_todos_los_contratos(cliente, entrar):
    """CP-C03 | RF05 | Contador lista contratos | Los 5 contratos"""
    assert len(cliente.get("/api/contratos", headers=entrar(CONTADOR)).json()) == 5


def test_contrato_ajeno_prohibido(cliente, entrar):
    """CP-C04 | RF05 | Jhon consulta el contrato 1 de otro arrendatario | 403"""
    r = cliente.get("/api/contratos/1", headers=entrar(OTRO_ARRENDATARIO))
    assert r.status_code == 403


def test_detalle_con_valores_calculados(cliente, entrar):
    """CP-C05 | RF05 | Contrato 1: 26 cabezas x $85.000 x 6 meses | Mensual 2.210.000, total 13.260.000"""
    c = cliente.get("/api/contratos/1", headers=entrar(ARRENDATARIO)).json()
    assert c["total_cabezas"] == 26
    assert c["valor_mensual"] == 2_210_000
    assert c["valor_total"] == 13_260_000
    assert c["fecha_fin"] == "2027-04-01"


def test_arrendatario_crea_contrato(cliente, entrar):
    """CP-C06 | RF05 | Arrendatario crea contrato sobre el lote 4 | 201, estado Activo y a su nombre"""
    r = cliente.post(
        "/api/contratos", json=_contrato_nuevo(), headers=entrar(ARRENDATARIO)
    )
    assert r.status_code == 201
    assert r.json()["estado"] == "Activo"
    assert r.json()["id_arrendatario"] == 2


def test_crear_contrato_fecha_invalida(cliente, entrar):
    """CP-C07 | RF05 | Fecha 2026-02-30 | 422 en fecha_inicio"""
    r = cliente.post(
        "/api/contratos",
        json=_contrato_nuevo(fecha_inicio="2026-02-30"),
        headers=entrar(ARRENDATARIO),
    )
    assert r.status_code == 422
    assert r.json()["campo"] == "fecha_inicio"


def test_crear_contrato_meses_fuera_de_rango(cliente, entrar):
    """CP-C08 | RF05 | Duracion 0 y 61 meses | 422 en ambos casos"""
    h = entrar(ARRENDATARIO)
    for meses in (0, 61):
        r = cliente.post(
            "/api/contratos", json=_contrato_nuevo(meses_duracion=meses), headers=h
        )
        assert r.status_code == 422


def test_crear_contrato_tarifa_cero(cliente, entrar):
    """CP-C09 | RF05 | Tarifa 0 | 422 en tarifa_por_cabeza"""
    r = cliente.post(
        "/api/contratos",
        json=_contrato_nuevo(tarifa_por_cabeza=0),
        headers=entrar(ARRENDATARIO),
    )
    assert r.status_code == 422
    assert r.json()["campo"] == "tarifa_por_cabeza"


def test_crear_contrato_lote_inexistente(cliente, entrar):
    """CP-C10 | RF05 | Lote 999 | 404"""
    r = cliente.post(
        "/api/contratos",
        json=_contrato_nuevo(id_lote=999),
        headers=entrar(ARRENDATARIO),
    )
    assert r.status_code == 404


def test_propietario_finaliza_contrato(cliente, entrar):
    """CP-C11 | RF05 | Propietario del lote cambia el estado a Finalizado | 200"""
    r = cliente.put(
        "/api/contratos/2", json={"estado": "Finalizado"}, headers=entrar(PROPIETARIO)
    )
    assert r.status_code == 200
    assert r.json()["estado"] == "Finalizado"


def test_otro_propietario_no_modifica_contrato(cliente, entrar):
    """CP-C12 | RF05 | Marta intenta modificar el contrato 1 (lote de Carlos) | 403"""
    r = cliente.put(
        "/api/contratos/1", json={"estado": "Anulado"}, headers=entrar(OTRO_PROPIETARIO)
    )
    assert r.status_code == 403


def test_eliminar_contrato_con_ganado(cliente, entrar):
    """CP-C13 | RF05 | Eliminar el contrato 1 que tiene ganado (FK RESTRICT) | 409"""
    r = cliente.delete("/api/contratos/1", headers=entrar(PROPIETARIO))
    assert r.status_code == 409


# ------------------------------- Ganado -------------------------------
def test_listar_ganado_del_contrato(cliente, entrar):
    """CP-G01 | CU-GAN | Ganado del contrato 1 | 5 hatos (26 cabezas)"""
    r = cliente.get("/api/contratos/1/ganado", headers=entrar(ARRENDATARIO))
    assert len(r.json()) == 5
    assert sum(g["cantidad_cabezas"] for g in r.json()) == 26


def test_agregar_ganado_dispara_alerta_de_sobrecarga(cliente, entrar):
    """CP-G02 | RF04 | Agregar 6 cabezas al lote 1 (26 + 6 = 32 de 30) | 201 y alerta SOBRECARGA"""
    r = cliente.post(
        "/api/contratos/1/ganado",
        json={"raza": "Nelore", "cantidad_cabezas": 6, "proposito": "Carne"},
        headers=entrar(ARRENDATARIO),
    )
    assert r.status_code == 201
    assert r.json()["estado_carga"]["nivel"] == "SOBRECARGA"
    assert r.json()["estado_carga"]["excedente"] == 2


def test_agregar_ganado_dentro_de_capacidad(cliente, entrar):
    """CP-G03 | CU-GAN | Agregar 2 cabezas al lote 1 (28 de 30) | 201 y nivel ALERTA"""
    r = cliente.post(
        "/api/contratos/1/ganado",
        json={"raza": "Nelore", "cantidad_cabezas": 2, "proposito": "Carne"},
        headers=entrar(ARRENDATARIO),
    )
    assert r.status_code == 201
    assert r.json()["estado_carga"]["nivel"] == "ALERTA"


def test_ganado_cantidad_invalida(cliente, entrar):
    """CP-G04 | CU-GAN | Cantidad 0, -3 y 2.5 | 422 en cantidad_cabezas"""
    h = entrar(ARRENDATARIO)
    for cantidad in (0, -3, 2.5):
        r = cliente.post(
            "/api/contratos/1/ganado",
            json={"raza": "Nelore", "cantidad_cabezas": cantidad, "proposito": "Carne"},
            headers=h,
        )
        assert r.status_code == 422
        assert r.json()["campo"] == "cantidad_cabezas"


def test_ganado_proposito_invalido(cliente, entrar):
    """CP-G05 | CU-GAN | Proposito 'Lana' | 422 en proposito"""
    r = cliente.post(
        "/api/contratos/1/ganado",
        json={"raza": "Nelore", "cantidad_cabezas": 2, "proposito": "Lana"},
        headers=entrar(ARRENDATARIO),
    )
    assert r.status_code == 422
    assert r.json()["campo"] == "proposito"


def test_ganado_raza_con_numeros(cliente, entrar):
    """CP-G06 | CU-GAN | Raza 'Gyr2000' | 422 por caracteres no permitidos"""
    r = cliente.post(
        "/api/contratos/1/ganado",
        json={"raza": "Gyr2000", "cantidad_cabezas": 2, "proposito": "Leche"},
        headers=entrar(ARRENDATARIO),
    )
    assert r.status_code == 422


def test_ganado_en_contrato_finalizado(cliente, entrar):
    """CP-G07 | CU-GAN | Agregar ganado al contrato 4 (Finalizado) | 409"""
    r = cliente.post(
        "/api/contratos/4/ganado",
        json={"raza": "Nelore", "cantidad_cabezas": 2, "proposito": "Carne"},
        headers=entrar(OTRO_ARRENDATARIO),
    )
    assert r.status_code == 409


def test_ganado_de_contrato_ajeno(cliente, entrar):
    """CP-G08 | CU-GAN | Jhon agrega ganado al contrato 1 de Brayian | 403"""
    r = cliente.post(
        "/api/contratos/1/ganado",
        json={"raza": "Nelore", "cantidad_cabezas": 2, "proposito": "Carne"},
        headers=entrar(OTRO_ARRENDATARIO),
    )
    assert r.status_code == 403


def test_actualizar_y_quitar_ganado(cliente, entrar):
    """CP-G09 | CU-GAN | Cambiar 8 a 10 cabezas y luego quitar el hato | 200 y 204"""
    h = entrar(ARRENDATARIO)
    r = cliente.put("/api/ganado/1", json={"cantidad_cabezas": 10}, headers=h)
    assert r.status_code == 200
    assert r.json()["cantidad_cabezas"] == 10
    assert cliente.delete("/api/ganado/1", headers=h).status_code == 204
    assert cliente.delete("/api/ganado/1", headers=h).status_code == 404


def test_contrato_finalizado_libera_carga(cliente, entrar):
    """CP-G10 | RF04 | Finalizar el contrato 2 | El lote 2 pasa de SOBRECARGA a NORMAL"""
    h = entrar(PROPIETARIO)
    cliente.put("/api/contratos/2", json={"estado": "Finalizado"}, headers=h)
    lote = cliente.get("/api/lotes/2", headers=h).json()
    assert lote["estado_carga"]["nivel"] == "NORMAL"


# ------------------------------- Documento -------------------------------
def test_documento_del_contrato(cliente, entrar):
    """CP-D01 | RF05 | Generar el documento del contrato 1 | Texto con partes y huella SHA-256 de 64 caracteres"""
    r = cliente.get("/api/contratos/1/documento", headers=entrar(ARRENDATARIO))
    assert r.status_code == 200
    cuerpo = r.json()
    assert "Carlos Ramirez Soto" in cuerpo["texto"]
    assert "$2.210.000 mensuales" in cuerpo["texto"]
    assert len(cuerpo["huella_sha256"]) == 64


def test_documento_es_determinista(cliente, entrar):
    """CP-D02 | RF05 | Generar dos veces el mismo documento | La huella es identica"""
    h = entrar(ARRENDATARIO)
    a = cliente.get("/api/contratos/1/documento", headers=h).json()["huella_sha256"]
    b = cliente.get("/api/contratos/1/documento", headers=h).json()["huella_sha256"]
    assert a == b


def test_documento_contrato_sin_ganado(cliente, entrar):
    """CP-D03 | RF05 | Contrato nuevo sin ganado | 409 pidiendo registrar el ganado"""
    h = entrar(ARRENDATARIO)
    nuevo = cliente.post("/api/contratos", json=_contrato_nuevo(), headers=h).json()
    r = cliente.get(f"/api/contratos/{nuevo['id_contrato']}/documento", headers=h)
    assert r.status_code == 409
