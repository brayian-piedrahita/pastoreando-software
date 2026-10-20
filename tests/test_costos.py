"""Pruebas del calculo de costos por Unidad Ganadera (RF01-RF02)."""

from tests.conftest import ARRENDATARIO, CONTADOR, TECNICO


def test_calcular_costo_contador(cliente, entrar, costo_valido):
    """CP-K01 | RF01-RF02 | Contador calcula 12.000.000 entre 50 animales de carne | 200 y $288.000 por cabeza"""
    r = cliente.post(
        "/api/costos/calcular", json=costo_valido, headers=entrar(CONTADOR)
    )
    assert r.status_code == 200
    assert r.json()["costo_unitario_final"] == 288_000
    assert len(r.json()["desglose"]) == 4


def test_calculo_queda_en_historial(cliente, entrar, costo_valido):
    """CP-K02 | RF01-RF02 | Calcular y consultar historial | El calculo aparece primero"""
    h = entrar(CONTADOR)
    cliente.post("/api/costos/calcular", json=costo_valido, headers=h)
    historial = cliente.get("/api/costos/historial", headers=h).json()
    assert historial[0]["costo_unitario_final"] == 288_000
    assert historial[0]["usuario"] == "Sandra Milena Bedoya Arango"


def test_costo_tecnico_sin_permiso(cliente, entrar, costo_valido):
    """CP-K03 | RF01-RF02 | Tecnico intenta calcular costos | 403"""
    r = cliente.post("/api/costos/calcular", json=costo_valido, headers=entrar(TECNICO))
    assert r.status_code == 403


def test_historial_arrendatario_sin_permiso(cliente, entrar):
    """CP-K04 | RF01-RF02 | Arrendatario consulta el historial | 403"""
    assert (
        cliente.get("/api/costos/historial", headers=entrar(ARRENDATARIO)).status_code
        == 403
    )


def test_costo_animales_cero(cliente, entrar, costo_valido):
    """CP-K05 | RF01-RF02 | Cantidad de animales 0 (division por cero) | 422 en cantidad_animales"""
    costo_valido["cantidad_animales"] = 0
    r = cliente.post(
        "/api/costos/calcular", json=costo_valido, headers=entrar(CONTADOR)
    )
    assert r.status_code == 422
    assert r.json()["campo"] == "cantidad_animales"


def test_costo_rubro_negativo(cliente, entrar, costo_valido):
    """CP-K06 | RF01-RF02 | Alimentacion -100 | 422 en alimentacion"""
    costo_valido["alimentacion"] = -100
    r = cliente.post(
        "/api/costos/calcular", json=costo_valido, headers=entrar(CONTADOR)
    )
    assert r.status_code == 422
    assert r.json()["campo"] == "alimentacion"


def test_costo_rubro_texto(cliente, entrar, costo_valido):
    """CP-K07 | RF01-RF02 | Impuestos '1500000abc' (texto) | 422 'Debe ser un número'"""
    costo_valido["impuestos"] = "1500000abc"
    r = cliente.post(
        "/api/costos/calcular", json=costo_valido, headers=entrar(CONTADOR)
    )
    assert r.status_code == 422
    assert "número" in r.json()["detalle"]


def test_costo_proposito_invalido(cliente, entrar, costo_valido):
    """CP-K08 | RF01-RF02 | Proposito 'Lana' | 422 en proposito"""
    costo_valido["proposito"] = "Lana"
    r = cliente.post(
        "/api/costos/calcular", json=costo_valido, headers=entrar(CONTADOR)
    )
    assert r.status_code == 422
    assert r.json()["campo"] == "proposito"


def test_costo_numero_gigante(cliente, entrar, costo_valido):
    """CP-K09 | RF01-RF02 | Alimentacion 1e30 | 422 por superar el maximo"""
    costo_valido["alimentacion"] = 1e30
    r = cliente.post(
        "/api/costos/calcular", json=costo_valido, headers=entrar(CONTADOR)
    )
    assert r.status_code == 422


def test_estrategias_disponibles(cliente, entrar):
    """CP-K10 | RF01-RF02 | Listar propositos | Carne 1.00, Leche 1.10 y Doble Proposito 1.05"""
    r = cliente.get("/api/costos/estrategias", headers=entrar(CONTADOR))
    factores = {e["proposito"]: e["factor_manejo"] for e in r.json()}
    assert factores == {"Carne": 1.0, "Leche": 1.1, "Doble Proposito": 1.05}
