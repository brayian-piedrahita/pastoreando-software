"""Pruebas complementarias de la ejecucion GA9-AA3-EV01.

Verifican con los valores exactos del libro de casos los comportamientos que
las suites existentes cubren solo en parte: CP-002, CP-003, CP-006, CP-011,
CP-015, CP-017, CP-018, CP-019, CP-023, CP-028 y CP-039. No modifican ninguna
prueba existente: usan las mismas fixtures (cliente, entrar, lote_valido).
"""

from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app import config

PROPIETARIO = "carlos.ramirez@pastoreando.co"
ARRENDATARIO = "brayian.piedrahita@pastoreando.co"
TECNICO = "laura.gomez@pastoreando.co"
CONTADOR = "sandra.bedoya@pastoreando.co"

# Datos del caso 001: 12.000.000 de costos y 50 animales.
COSTOS = {
    "alimentacion": 6000000,
    "mantenimiento": 3000000,
    "servicios": 1500000,
    "impuestos": 1500000,
    "cantidad_animales": 50,
}


# ------------------------------------------------------------------ apoyo
def _buscar(dato, clave):
    """Busca una clave en un JSON anidado y devuelve su valor."""
    if isinstance(dato, dict):
        if clave in dato:
            return dato[clave]
        valores = list(dato.values())
    elif isinstance(dato, list):
        valores = dato
    else:
        return None
    for valor in valores:
        encontrado = _buscar(valor, clave)
        if encontrado is not None:
            return encontrado
    return None


def _textos(dato):
    """Reune todos los textos (claves y valores) de un JSON anidado."""
    if isinstance(dato, str):
        return [dato]
    if isinstance(dato, dict):
        partes = list(dato.keys()) + list(dato.values())
    elif isinstance(dato, list):
        partes = dato
    else:
        return []
    return [texto for parte in partes for texto in _textos(parte)]


def _lista(dato):
    """Devuelve la lista de un JSON que es una lista o la contiene."""
    if isinstance(dato, list):
        return dato
    if isinstance(dato, dict):
        for valor in dato.values():
            if isinstance(valor, list):
                return valor
    return []


def _proposito(cliente, entrar, palabra):
    """Nombre exacto del proposito segun la API, sin suponer escritura."""
    respuesta = cliente.get("/api/costos/estrategias", headers=entrar(CONTADOR))
    assert respuesta.status_code == 200
    candidatos = [t for t in _textos(respuesta.json()) if palabra in t.lower()]
    assert candidatos, "Sin proposito '%s' en %s" % (palabra, respuesta.json())
    return min(candidatos, key=len)


def _calcular(cliente, entrar, correo, palabra):
    proposito = _proposito(cliente, entrar, palabra)
    datos = dict(COSTOS, proposito=proposito)
    return cliente.post("/api/costos/calcular", json=datos, headers=entrar(correo))


def _cabecera_y_token(cabeceras):
    """Separa el nombre del encabezado y el token de la cabecera de sesion."""
    nombre = next(iter(cabeceras))
    return nombre, cabeceras[nombre].split(" ", 1)[1]


# ------------------------------------------------- RF01 (CP-002 y CP-003)
@pytest.mark.parametrize(
    "palabra,factor,margen,final,total",
    [
        pytest.param("carne", 1.00, 48000, 288000, 14400000, id="referencia-carne"),
        pytest.param("leche", 1.10, 52800, 316800, 15840000, id="CP-002-leche"),
        pytest.param("doble", 1.05, 50400, 302400, 15120000, id="CP-003-doble"),
    ],
)
def test_costo_por_proposito_con_valores_del_caso(
    cliente, entrar, palabra, factor, margen, final, total
):
    """CP-002/003 | RF01 | Costo por cabeza segun el proposito | Valores exactos"""
    respuesta = _calcular(cliente, entrar, CONTADOR, palabra)
    assert respuesta.status_code == 200, respuesta.text
    resultado = respuesta.json()
    assert float(_buscar(resultado, "subtotal_lote")) == 12000000
    assert float(_buscar(resultado, "costo_base_por_cabeza")) == 240000
    assert float(_buscar(resultado, "factor_manejo")) == pytest.approx(factor)
    assert float(_buscar(resultado, "margen_por_cabeza")) == pytest.approx(margen)
    assert float(_buscar(resultado, "costo_unitario_final")) == pytest.approx(final)
    assert float(_buscar(resultado, "total_lote_final")) == pytest.approx(total)


# ------------------------------------------------------------ CP-006
@pytest.mark.parametrize(
    "correo,esperado",
    [
        pytest.param(TECNICO, 403, id="tecnico-403"),
        pytest.param(CONTADOR, 200, id="contador-200"),
        pytest.param(PROPIETARIO, 200, id="propietario-200"),
        pytest.param(ARRENDATARIO, 200, id="arrendatario-200"),
    ],
)
def test_permisos_del_calculo_de_costos_por_rol(cliente, entrar, correo, esperado):
    """CP-006 | RF01 | Permisos del calculo por rol | Tecnico 403, otros 200"""
    respuesta = _calcular(cliente, entrar, correo, "carne")
    assert respuesta.status_code == esperado, respuesta.text


# ------------------------------------------------------------ CP-015
def test_token_vencido_se_rechaza(cliente, entrar):
    """CP-015 | Acceso | Token con vigencia vencida | 401 y aviso de sesion"""
    cabeceras = entrar(CONTADOR)
    nombre, _ = _cabecera_y_token(cabeceras)
    yo = cliente.get("/api/auth/yo", headers=cabeceras)
    assert yo.status_code == 200, "La sesion valida debe funcionar"
    ahora = datetime.now(timezone.utc)
    carga = {
        "sub": str(yo.json()["id_usuario"]),
        "rol": yo.json()["rol"],
        "nombre": yo.json()["nombre"],
        "iat": ahora - timedelta(hours=2),
        "exp": ahora - timedelta(hours=1),
    }
    vencido = jwt.encode(carga, config.JWT_CLAVE, algorithm=config.JWT_ALGORITMO)
    respuesta = cliente.get("/api/auth/yo", headers={nombre: "Bearer " + vencido})
    assert respuesta.status_code == 401
    assert "expir" in respuesta.json()["detalle"].lower()


def test_token_con_firma_alterada_se_rechaza(cliente, entrar):
    """CP-015 | Acceso | Token con la firma modificada | 401"""
    nombre, token = _cabecera_y_token(entrar(CONTADOR))
    cabecera, carga, firma = token.split(".")
    otra = "B" if firma[0] != "B" else "C"
    alterado = ".".join([cabecera, carga, otra + firma[1:]])
    respuesta = cliente.get("/api/auth/yo", headers={nombre: "Bearer " + alterado})
    assert respuesta.status_code == 401


# ------------------------------------------------------------ CP-011
def _registrar(cliente, cedula="9000000001", contrasena="Clave2026x"):
    datos = {
        "nombre": "Ana",
        "apellidos": "Ruiz",
        "cedula": cedula,
        "rol": "Arrendatario",
        "correo": "limites.ga9@pastoreando.co",
        "contrasena": contrasena,
        "codigo_profesional": None,
    }
    return cliente.post("/api/auth/registro", json=datos)


@pytest.mark.parametrize(
    "cedula,esperado",
    [
        pytest.param("90000", 422, id="5-digitos"),
        pytest.param("900001", 201, id="6-digitos"),
        pytest.param("900000000001", 201, id="12-digitos"),
        pytest.param("9000000000001", 422, id="13-digitos"),
        pytest.param("90000a", 422, id="con-letra"),
    ],
)
def test_cedula_en_los_bordes(cliente, cedula, esperado):
    """CP-011 | Acceso | Cedula de 6 a 12 digitos | Bordes 5, 6, 12 y 13"""
    respuesta = _registrar(cliente, cedula=cedula)
    assert respuesta.status_code == esperado, respuesta.text


@pytest.mark.parametrize(
    "contrasena,esperado",
    [
        pytest.param("Abcde12", 422, id="7-caracteres"),
        pytest.param("Abcdef12", 201, id="8-caracteres"),
        pytest.param("A1" + "b" * 70, 201, id="72-caracteres"),
        pytest.param("A1" + "b" * 71, 422, id="73-caracteres"),
        pytest.param("Abcdefgh", 422, id="solo-letras"),
        pytest.param("12345678", 422, id="solo-numeros"),
    ],
)
def test_contrasena_en_los_bordes(cliente, contrasena, esperado):
    """CP-011 | Acceso | Contrasena de 8 a 72 con letras y numeros | Bordes"""
    respuesta = _registrar(cliente, contrasena=contrasena)
    assert respuesta.status_code == esperado, respuesta.text


# ------------------------------------------------------------ CP-023
@pytest.mark.parametrize(
    "campo,valor",
    [
        pytest.param("hectareas", 0, id="hectareas-0"),
        pytest.param("hectareas", -5, id="hectareas-negativas"),
        pytest.param("capacidad_carga", 0, id="capacidad-0"),
        pytest.param("capacidad_carga", -10, id="capacidad-negativa"),
    ],
)
def test_lote_rechaza_cero_y_negativos(cliente, entrar, lote_valido, campo, valor):
    """CP-023 | RF04 | Hectareas o capacidad en cero o negativas | 422"""
    datos = dict(lote_valido)
    datos[campo] = valor
    respuesta = cliente.post("/api/lotes", json=datos, headers=entrar(PROPIETARIO))
    assert respuesta.status_code == 422, respuesta.text
    assert campo in str(respuesta.json())


# ------------------------------------------------------------ CP-028
def _contexto_arrendatario(cliente, entrar):
    cabeceras = entrar(ARRENDATARIO)
    yo = cliente.get("/api/auth/yo", headers=cabeceras).json()
    lotes = _lista(cliente.get("/api/lotes", headers=cabeceras).json())
    assert lotes, "El arrendatario debe poder ver lotes"
    return cabeceras, yo["id_usuario"], [lote["id_lote"] for lote in lotes]


def _crear_contrato(cliente, cabeceras, id_lote, id_arrendatario, **cambios):
    datos = {
        "id_lote": id_lote,
        "id_arrendatario": id_arrendatario,
        "fecha_inicio": "2026-10-01",
        "meses_duracion": 6,
        "tarifa_por_cabeza": 85000,
    }
    datos.update(cambios)
    return cliente.post("/api/contratos", json=datos, headers=cabeceras)


@pytest.mark.parametrize(
    "cambios",
    [
        pytest.param({"meses_duracion": 0}, id="0-meses"),
        pytest.param({"meses_duracion": 61}, id="61-meses"),
        pytest.param({"fecha_inicio": "2026-02-30"}, id="fecha-inexistente"),
        pytest.param({"tarifa_por_cabeza": 0}, id="tarifa-0"),
    ],
)
def test_contrato_rechaza_valores_invalidos(cliente, entrar, cambios):
    """CP-028 | RF05 | Duracion, fecha y tarifa invalidas | 422"""
    cabeceras, id_arrendatario, lotes = _contexto_arrendatario(cliente, entrar)
    respuesta = _crear_contrato(
        cliente, cabeceras, lotes[0], id_arrendatario, **cambios
    )
    assert respuesta.status_code == 422, respuesta.text


@pytest.mark.parametrize("meses", [1, 60])
def test_contrato_acepta_duraciones_en_los_bordes(cliente, entrar, meses):
    """CP-028 | RF05 | Duracion de 1 y de 60 meses | Se acepta (201)"""
    cabeceras, id_arrendatario, lotes = _contexto_arrendatario(cliente, entrar)
    codigos = []
    for id_lote in lotes:
        respuesta = _crear_contrato(
            cliente, cabeceras, id_lote, id_arrendatario, meses_duracion=meses
        )
        codigos.append(respuesta.status_code)
        if respuesta.status_code == 201:
            break
    assert 201 in codigos, codigos


# ------------------------------------------------- CP-017, CP-018 y CP-019
@pytest.mark.parametrize(
    "cabezas,nivel,excedente",
    [
        pytest.param(799, "NORMAL", 0, id="CP-017-799"),
        pytest.param(800, "NORMAL", 0, id="CP-017-800"),
        pytest.param(801, "ALERTA", 0, id="CP-018-801"),
        pytest.param(1000, "ALERTA", 0, id="CP-018-1000"),
        pytest.param(1001, "SOBRECARGA", 1, id="CP-019-1001"),
        pytest.param(1500, "SOBRECARGA", 500, id="CP-019-1500"),
    ],
)
def test_nivel_de_carga_con_capacidad_de_1000(
    cliente, entrar, lote_valido, cabezas, nivel, excedente
):
    """CP-017/018/019 | RF04 | Alerta de carga con capacidad 1000 | Bordes"""
    propietario = entrar(PROPIETARIO)
    datos = dict(
        lote_valido,
        nombre_lote="Lote de limites",
        hectareas=50,
        capacidad_carga=1000,
    )
    lote = cliente.post("/api/lotes", json=datos, headers=propietario)
    assert lote.status_code == 201, lote.text
    id_lote = _buscar(lote.json(), "id_lote")

    arrendatario = entrar(ARRENDATARIO)
    yo = cliente.get("/api/auth/yo", headers=arrendatario).json()
    contrato = _crear_contrato(cliente, arrendatario, id_lote, yo["id_usuario"])
    assert contrato.status_code == 201, contrato.text
    id_contrato = _buscar(contrato.json(), "id_contrato")

    # La API limita cada hato a 1000 cabezas; una carga mayor se registra en
    # varios hatos del mismo contrato, que es como ocurre en la practica.
    pendientes = cabezas
    while pendientes > 0:
        lote_de_cabezas = min(pendientes, 1000)
        hato = {
            "raza": "Brahman",
            "cantidad_cabezas": lote_de_cabezas,
            "proposito": "Carne",
        }
        ganado = cliente.post(
            "/api/contratos/%s/ganado" % id_contrato,
            json=hato,
            headers=arrendatario,
        )
        assert ganado.status_code == 201, ganado.text
        pendientes -= lote_de_cabezas

    consulta = cliente.get("/api/lotes/%s" % id_lote, headers=propietario)
    assert consulta.status_code == 200, consulta.text
    estado = _buscar(consulta.json(), "estado_carga")
    assert estado["nivel"] == nivel
    if nivel == "SOBRECARGA":
        assert estado["excedente"] == excedente
        assert len(estado["sugerencias"]) >= 1


# ------------------------------------------------------------ CP-039
def _id_hato(cliente, cabeceras):
    for contrato in _lista(cliente.get("/api/contratos", headers=cabeceras).json()):
        url = "/api/contratos/%s/ganado" % contrato["id_contrato"]
        hatos = _lista(cliente.get(url, headers=cabeceras).json())
        if hatos:
            return hatos[0]["id_ganado"]
    pytest.fail("No hay ningun hato en los datos de prueba")


@pytest.mark.parametrize(
    "texto,esperado",
    [
        pytest.param("a" * 9, 422, id="9-caracteres"),
        pytest.param("a" * 10, 201, id="10-caracteres"),
        pytest.param("a" * 500, 201, id="500-caracteres"),
        pytest.param("a" * 501, 422, id="501-caracteres"),
        pytest.param("<b>Revisar el potrero</b>", 422, id="con-etiqueta"),
    ],
)
def test_recomendacion_en_los_bordes(cliente, entrar, texto, esperado):
    """CP-039 | RF09 | Texto de 10 a 500 caracteres sin etiquetas | Bordes"""
    cabeceras = entrar(TECNICO)
    id_hato = _id_hato(cliente, cabeceras)
    respuesta = cliente.post(
        "/api/ganado/%s/recomendaciones" % id_hato,
        json={"descripcion": texto},
        headers=cabeceras,
    )
    assert respuesta.status_code == esperado, respuesta.text
