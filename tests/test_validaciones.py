"""Pruebas de validacion: fechas, numeros, textos, caracteres especiales y longitudes."""

import pytest

from app.domain.errores import ValidacionError
from app.domain.validaciones import (
    validar_correo,
    validar_entero,
    validar_fecha,
    validar_numero,
    validar_opcion,
    validar_texto,
)


# ------------------------------- Fechas -------------------------------
def test_fecha_valida():
    """VAL-F01 | Fecha | 2026-10-20 se acepta | Date(2026, 10, 20)"""
    assert validar_fecha("2026-10-20", "fecha").isoformat() == "2026-10-20"


@pytest.mark.parametrize("valor", ["2026-02-30", "2026-13-01", "2025-02-29"])
def test_fecha_inexistente(valor):
    """VAL-F02 | Fecha | Dias o meses que no existen en el calendario | Rechaza"""
    with pytest.raises(ValidacionError, match="no existe"):
        validar_fecha(valor, "fecha")


@pytest.mark.parametrize("valor", ["20/10/2026", "2026-1-5", "hoy", "", None, 20261020])
def test_fecha_formato_incorrecto(valor):
    """VAL-F03 | Fecha | Formato distinto de AAAA-MM-DD, vacio o no texto | Rechaza"""
    with pytest.raises(ValidacionError, match="AAAA-MM-DD"):
        validar_fecha(valor, "fecha")


@pytest.mark.parametrize("valor", ["1999-12-31", "2101-01-01"])
def test_fecha_fuera_de_rango(valor):
    """VAL-F04 | Fecha | Antes de 2000 o despues de 2100 | Rechaza"""
    with pytest.raises(ValidacionError, match="entre 2000 y 2100"):
        validar_fecha(valor, "fecha")


# ------------------------------- Numeros -------------------------------
def test_numero_valido():
    """VAL-N01 | Numero | 12.5 dentro del rango | Devuelve 12.5"""
    assert validar_numero(12.5, "x", 0, 100) == 12.5


@pytest.mark.parametrize("valor", ["12", None, True, [1], {}])
def test_numero_tipo_incorrecto(valor):
    """VAL-N02 | Numero | Texto, nulo, booleano o lista en campo numerico | Rechaza"""
    with pytest.raises(ValidacionError, match="número"):
        validar_numero(valor, "x", 0, 100)


@pytest.mark.parametrize("valor", [float("nan"), float("inf"), float("-inf")])
def test_numero_no_finito(valor):
    """VAL-N03 | Numero | NaN o infinito | Rechaza"""
    with pytest.raises(ValidacionError, match="válido"):
        validar_numero(valor, "x", 0, 100)


def test_numero_limites():
    """VAL-N04 | Numero | Cero con minimo excluyente y valor sobre el maximo | Rechaza"""
    with pytest.raises(ValidacionError, match="mayor a 0"):
        validar_numero(0, "x", 0, 100, incluir_minimo=False)
    with pytest.raises(ValidacionError, match="No puede superar"):
        validar_numero(101, "x", 0, 100)
    assert validar_numero(0, "x", 0, 100) == 0.0


def test_entero_rechaza_decimales_y_negativos():
    """VAL-N05 | Entero | 2.5 y -1 en campo entero | Rechaza; 3.0 se acepta como 3"""
    with pytest.raises(ValidacionError, match="entero"):
        validar_entero(2.5, "x", 1, 10)
    with pytest.raises(ValidacionError, match="mayor o igual a 1"):
        validar_entero(-1, "x", 1, 10)
    assert validar_entero(3.0, "x", 1, 10) == 3


# ------------------------------- Textos -------------------------------
def test_texto_normaliza_espacios():
    """VAL-T01 | Texto | '  Lote   Norte ' | 'Lote Norte' sin espacios sobrantes"""
    assert validar_texto("  Lote   Norte ", "n", 3, 50) == "Lote Norte"


@pytest.mark.parametrize("valor", ["", "   ", None, 123])
def test_texto_vacio_o_no_texto(valor):
    """VAL-T02 | Texto | Vacio, solo espacios, nulo o numero | Rechaza"""
    with pytest.raises(ValidacionError):
        validar_texto(valor, "n", 1, 50)


def test_texto_tildes_y_enie():
    """VAL-T03 | Texto | 'Potrero Peñón Árbol' con tildes y ñ | Se acepta"""
    assert validar_texto("Potrero Peñón Árbol", "n", 3, 50) == "Potrero Peñón Árbol"


# ------------------------- Caracteres especiales -------------------------
@pytest.mark.parametrize(
    "valor",
    [
        "Lote<script>",
        "Lote'; DROP TABLE LOTES;--",
        "Lote@#$",
        "Lote\x00Norte",
        "Lote🙂",
    ],
)
def test_texto_caracteres_especiales(valor):
    """VAL-C01 | Especiales | Etiquetas HTML, SQL, simbolos, nulo o emoji | Rechaza"""
    with pytest.raises(ValidacionError, match="no permitidos"):
        validar_texto(valor, "n", 3, 50)


def test_raza_no_acepta_numeros():
    """VAL-C02 | Especiales | Raza 'Gyr123' con digitos | Rechaza"""
    from app.domain.validaciones import PATRON_LETRAS

    with pytest.raises(ValidacionError, match="no permitidos"):
        validar_texto("Gyr123", "raza", 2, 40, PATRON_LETRAS)


# ------------------------------- Longitudes -------------------------------
def test_texto_longitud_minima_y_maxima():
    """VAL-L01 | Longitud | 2 caracteres (min 3) y 51 (max 50) | Rechaza; 3 y 50 pasan"""
    with pytest.raises(ValidacionError, match="al menos 3"):
        validar_texto("ab", "n", 3, 50)
    with pytest.raises(ValidacionError, match="No puede superar 50"):
        validar_texto("a" * 51, "n", 3, 50)
    assert validar_texto("abc", "n", 3, 50) == "abc"
    assert len(validar_texto("a" * 50, "n", 3, 50)) == 50


# ------------------------------- Opciones y correo -------------------------------
def test_opcion_invalida():
    """VAL-O01 | Opcion | Proposito 'Lana' fuera del ENUM | Rechaza"""
    with pytest.raises(ValidacionError, match="Debe ser uno de"):
        validar_opcion("Lana", "proposito", ("Carne", "Leche"))


@pytest.mark.parametrize("valor", ["sin-arroba", "a@b", "a b@c.co", "@x.com", ""])
def test_correo_invalido(valor):
    """VAL-E01 | Correo | Sin arroba, sin dominio o con espacios | Rechaza"""
    with pytest.raises(ValidacionError):
        validar_correo(valor)


def test_correo_se_normaliza():
    """VAL-E02 | Correo | 'Ana@Correo.CO' | Se guarda en minusculas"""
    assert validar_correo("Ana@Correo.CO") == "ana@correo.co"
