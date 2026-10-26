"""Pruebas complementarias de la ejecucion GA9-AA3-EV01 (segunda parte).

Cierran tres casos que las suites existentes verificaban solo en parte:
CP-004 (desglose por rubro), CP-005 (entradas invalidas sin rastro en el
historial) y CP-026 (visibilidad de contratos por rol). No modifican ninguna
prueba existente: usan las mismas fixtures (cliente, entrar).
"""

import pytest

PROPIETARIO = "carlos.ramirez@pastoreando.co"
ARRENDATARIO = "brayian.piedrahita@pastoreando.co"
TECNICO = "laura.gomez@pastoreando.co"
CONTADOR = "sandra.bedoya@pastoreando.co"

# Datos del caso 001: 12.000.000 de costos y 50 animales de carne.
COSTOS = {
    "alimentacion": 6000000,
    "mantenimiento": 3000000,
    "servicios": 1500000,
    "impuestos": 1500000,
    "cantidad_animales": 50,
    "proposito": "Carne",
}


# ------------------------------------------------------------------ CP-004
def test_desglose_por_rubro_del_caso_004(cliente, entrar):
    """CP-004 | RF02 | Desglose por rubro | 50, 25, 12,5 y 12,5 por ciento"""
    contador = entrar(CONTADOR)
    respuesta = cliente.post("/api/costos/calcular", json=COSTOS, headers=contador)
    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    base = cuerpo["costo_base_por_cabeza"]
    assert base == 240000

    esperado = {
        "Alimentación": (6000000, 120000, 50.0),
        "Mantenimiento": (3000000, 60000, 25.0),
        "Servicios": (1500000, 30000, 12.5),
        "Impuestos": (1500000, 30000, 12.5),
    }
    desglose = {fila["rubro"]: fila for fila in cuerpo["desglose"]}
    assert set(desglose) == set(esperado)
    for rubro, (lote, cabeza, porcentaje) in esperado.items():
        fila = desglose[rubro]
        assert fila["valor_lote"] == lote, rubro
        assert fila["valor_por_cabeza"] == cabeza, rubro
        assert fila["porcentaje"] == pytest.approx(porcentaje), rubro
        # El valor por cabeza coincide con el porcentaje del costo base.
        assert fila["valor_por_cabeza"] == pytest.approx(base * porcentaje / 100)
    assert sum(f["porcentaje"] for f in cuerpo["desglose"]) == pytest.approx(100)


# ------------------------------------------------------------------ CP-005
CASOS_INVALIDOS = [
    pytest.param({"cantidad_animales": 0}, id="animales-0"),
    pytest.param({"cantidad_animales": -5}, id="animales-negativos"),
    pytest.param({"cantidad_animales": "abc"}, id="animales-texto"),
    pytest.param(
        {"alimentacion": 0, "mantenimiento": 0, "servicios": 0, "impuestos": 0},
        id="todos-los-rubros-en-0",
    ),
    pytest.param({"alimentacion": -1}, id="rubro-negativo"),
    pytest.param({"proposito": "Cerdos"}, id="proposito-inexistente"),
]


@pytest.mark.parametrize("cambio", CASOS_INVALIDOS)
def test_calculo_invalido_se_rechaza_y_no_deja_rastro(cliente, entrar, cambio):
    """CP-005 | RF01 | Entradas invalidas del calculo | 422 y historial intacto"""
    contador = entrar(CONTADOR)
    antes = cliente.get("/api/costos/historial", headers=contador).json()

    respuesta = cliente.post(
        "/api/costos/calcular", json=dict(COSTOS, **cambio), headers=contador
    )
    assert respuesta.status_code == 422, respuesta.text

    despues = cliente.get("/api/costos/historial", headers=contador).json()
    assert len(despues) == len(antes)


# ------------------------------------------------------------------ CP-026
def test_cada_rol_ve_solo_los_contratos_que_le_corresponden(cliente, entrar):
    """CP-026 | RF05 | Contratos visibles por rol | Tecnico y Contador ven todos"""
    ids = {}
    for nombre, correo in {
        "tecnico": TECNICO,
        "contador": CONTADOR,
        "arrendatario": ARRENDATARIO,
        "propietario": PROPIETARIO,
    }.items():
        respuesta = cliente.get("/api/contratos", headers=entrar(correo))
        assert respuesta.status_code == 200, (nombre, respuesta.text)
        ids[nombre] = sorted(c["id_contrato"] for c in respuesta.json())

    assert ids["tecnico"] == [1, 2, 3, 4, 5]
    assert ids["contador"] == [1, 2, 3, 4, 5]
    assert ids["arrendatario"] == [1, 5]
    assert ids["propietario"] == [1, 2]

    # Un contrato de otra persona se rechaza con el mensaje del caso.
    ajeno = cliente.get("/api/contratos/2", headers=entrar(ARRENDATARIO))
    assert ajeno.status_code == 403
    assert ajeno.json()["detalle"] == "El contrato pertenece a otras personas"
