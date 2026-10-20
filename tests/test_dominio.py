"""Pruebas de las reglas del dominio: alerta de carga, costos, contratos y Singleton."""

from datetime import date

import pytest

from app.domain.contrato import Contrato, sumar_meses
from app.domain.costo import (
    CostoCarne,
    CostoDobleProposito,
    CostoLeche,
    DatosCosto,
    calcular_costo,
    obtener_estrategia,
)
from app.domain.errores import ValidacionError
from app.domain.ganado import Ganado
from app.domain.lote import (
    NIVEL_ALERTA,
    NIVEL_NORMAL,
    NIVEL_SOBRECARGA,
    Lote,
)
from app.infrastructure.db import BaseDatos, obtener_bd


def _lote(capacidad: int = 30) -> Lote:
    return Lote(1, "Potrero Uno", 10, capacidad, "Kikuyo")


# ------------------------------- Alerta RF04 -------------------------------
@pytest.mark.parametrize(
    "cabezas, nivel",
    [
        (0, NIVEL_NORMAL),
        (24, NIVEL_NORMAL),
        (25, NIVEL_ALERTA),
        (30, NIVEL_ALERTA),
        (31, NIVEL_SOBRECARGA),
    ],
)
def test_niveles_de_alerta(cabezas, nivel):
    """CP-A01 | RF04 | Capacidad 30: 0, 24, 25, 30 y 31 cabezas | NORMAL, NORMAL, ALERTA, ALERTA, SOBRECARGA"""
    assert _lote(30).nivel_alerta(cabezas) == nivel


def test_sobrecarga_calcula_excedente_y_sugiere():
    """CP-A02 | RF04 | 36 cabezas en capacidad 30 | Excedente 6, 120 % y 3 sugerencias"""
    estado = _lote(30).evaluar_carga(36)
    assert estado.excedente == 6
    assert estado.porcentaje == 120.0
    assert "Sobrecarga" in estado.mensaje
    assert len(estado.sugerencias) == 3


def test_estado_normal_sin_sugerencias():
    """CP-A03 | RF04 | 10 cabezas en capacidad 30 | Sin alerta ni sugerencias"""
    estado = _lote(30).evaluar_carga(10)
    assert estado.sugerencias == []
    assert estado.excedente == 0


# ------------------------------- Entidades -------------------------------
def test_lote_rechaza_hectareas_cero():
    """CP-E01 | CU-LOT | Lote con 0 hectareas (CHECK hectareas > 0) | ValidacionError"""
    with pytest.raises(ValidacionError, match="mayor a 0"):
        Lote(1, "Potrero Uno", 0, 10, "Kikuyo")


def test_ganado_rechaza_cantidad_cero():
    """CP-E02 | CU-GAN | Ganado con 0 cabezas (CHECK cantidadCabezas > 0) | ValidacionError"""
    with pytest.raises(ValidacionError):
        Ganado(1, "Brahman", 0, "Carne")


def test_contrato_calcula_valores():
    """CP-E03 | RF05 | 26 cabezas x $85.000 por 6 meses | Mensual 2.210.000 y total 13.260.000"""
    c = Contrato(2, 1, "2026-10-01", 6, 85_000)
    assert c.valor_mensual(26) == 2_210_000
    assert c.valor_total(26) == 13_260_000
    assert c.fecha_fin == date(2027, 4, 1)


def test_sumar_meses_ajusta_fin_de_mes():
    """CP-E04 | RF05 | 31 de enero + 1 mes | 28 de febrero (ultimo dia del mes)"""
    assert sumar_meses(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert sumar_meses(date(2026, 11, 15), 3) == date(2027, 2, 15)


# ------------------------------- Strategy RF01 -------------------------------
def test_estrategias_por_proposito():
    """CP-S01 | RF01-RF02 | Propositos Carne, Leche y Doble Proposito | Clase y factor de cada estrategia"""
    assert isinstance(obtener_estrategia("Carne"), CostoCarne)
    assert isinstance(obtener_estrategia("Leche"), CostoLeche)
    assert isinstance(obtener_estrategia("Doble Proposito"), CostoDobleProposito)
    assert obtener_estrategia("Leche").factor_manejo == 1.10


def test_calculo_ejemplo_del_analisis():
    """CP-S02 | RF01-RF02 | 12.000.000 entre 50 animales de carne | Base 240.000 y final 288.000"""
    datos = DatosCosto(6_000_000, 3_000_000, 1_500_000, 1_500_000, 50, "Carne")
    r = calcular_costo(datos)
    assert r["costo_base_por_cabeza"] == 240_000
    assert r["margen_por_cabeza"] == 48_000
    assert r["costo_unitario_final"] == 288_000
    assert r["total_lote_final"] == 14_400_000


def test_calculo_leche_lleva_recargo():
    """CP-S03 | RF01-RF02 | Mismos datos con ganado de leche | Final 316.800 (factor 1.10)"""
    datos = DatosCosto(6_000_000, 3_000_000, 1_500_000, 1_500_000, 50, "Leche")
    assert calcular_costo(datos)["costo_unitario_final"] == 316_800


def test_desglose_suma_cien_por_ciento():
    """CP-S04 | RF01-RF02 | Desglose de los 4 rubros | Porcentajes suman 100 y orden Alimentacion primero"""
    datos = DatosCosto(6_000_000, 3_000_000, 1_500_000, 1_500_000, 50, "Carne")
    desglose = calcular_costo(datos)["desglose"]
    assert [f["rubro"] for f in desglose][0] == "Alimentación"
    assert sum(f["porcentaje"] for f in desglose) == pytest.approx(100, abs=0.2)


def test_costo_rechaza_todo_en_cero():
    """CP-S05 | RF01-RF02 | Los cuatro rubros en cero | ValidacionError (evita costo 0)"""
    with pytest.raises(ValidacionError, match="mayor a cero"):
        DatosCosto(0, 0, 0, 0, 10, "Carne")


# ------------------------------- Singleton -------------------------------
def test_base_datos_es_singleton():
    """CP-P01 | Patron | Dos llamadas a BaseDatos() | Misma instancia"""
    assert BaseDatos() is BaseDatos()
    assert obtener_bd() is BaseDatos()
