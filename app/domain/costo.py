"""Calculo del costo por Unidad Ganadera (RF01) y su desglose (RF02).

Se aplica el patron Strategy: cada proposito del ganado (carne, leche o doble
proposito) ajusta el costo base por cabeza con su propia regla de manejo.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app import config
from app.domain.ganado import PROPOSITOS
from app.domain.errores import ValidacionError
from app.domain.validaciones import validar_entero, validar_numero, validar_opcion

TOPE_RUBRO = 1_000_000_000_000


class EstrategiaCosto(ABC):
    """Contrato que debe cumplir cada forma de ajustar el costo por cabeza."""

    nombre: str
    descripcion: str

    @abstractmethod
    def ajustar(self, costo_base: float) -> float:
        """Devuelve el costo por cabeza ajustado por el manejo del proposito."""

    @property
    @abstractmethod
    def factor_manejo(self) -> float:
        """Multiplicador aplicado al costo base (1.0 = sin recargo)."""


class CostoCarne(EstrategiaCosto):
    """Ganado de carne: no lleva recargo de manejo."""

    nombre = "Carne"
    descripcion = "Sin recargo de manejo"
    factor_manejo = 1.00

    def ajustar(self, costo_base: float) -> float:
        return costo_base * self.factor_manejo


class CostoLeche(EstrategiaCosto):
    """Ganado de leche: recargo por ordeño, sanidad de ubre y frio."""

    nombre = "Leche"
    descripcion = "Recargo del 10 % por ordeño y sanidad"
    factor_manejo = 1.10

    def ajustar(self, costo_base: float) -> float:
        return costo_base * self.factor_manejo


class CostoDobleProposito(EstrategiaCosto):
    """Doble proposito: recargo intermedio entre carne y leche."""

    nombre = "Doble Proposito"
    descripcion = "Recargo del 5 % por manejo mixto"
    factor_manejo = 1.05

    def ajustar(self, costo_base: float) -> float:
        return costo_base * self.factor_manejo


ESTRATEGIAS: dict[str, EstrategiaCosto] = {
    "Carne": CostoCarne(),
    "Leche": CostoLeche(),
    "Doble Proposito": CostoDobleProposito(),
}


def obtener_estrategia(proposito: str) -> EstrategiaCosto:
    """Devuelve la estrategia que corresponde al proposito del ganado."""
    return ESTRATEGIAS[validar_opcion(proposito, "proposito", PROPOSITOS)]


@dataclass
class DatosCosto:
    """Costos ingresados por el contador para calcular el valor por cabeza."""

    alimentacion: float
    mantenimiento: float
    servicios: float
    impuestos: float
    cantidad_animales: int
    proposito: str

    def __post_init__(self) -> None:
        """Valida cada rubro, la cantidad de animales y el proposito."""
        for campo in ("alimentacion", "mantenimiento", "servicios", "impuestos"):
            valor = validar_numero(getattr(self, campo), campo, 0, TOPE_RUBRO)
            setattr(self, campo, round(valor, 2))
        self.cantidad_animales = validar_entero(
            self.cantidad_animales, "cantidad_animales", 1, 100_000
        )
        self.proposito = validar_opcion(self.proposito, "proposito", PROPOSITOS)
        if self.subtotal <= 0:
            raise ValidacionError(
                "Ingrese al menos un costo mayor a cero", "alimentacion"
            )

    @property
    def subtotal(self) -> float:
        """Suma de los cuatro rubros de costo del lote."""
        return round(
            self.alimentacion + self.mantenimiento + self.servicios + self.impuestos,
            2,
        )


def calcular_costo(datos: DatosCosto) -> dict:
    """Calcula el costo por cabeza y el desglose por rubro.

    Pasos: subtotal del lote, costo base por cabeza, ajuste por proposito
    (Strategy) y margen de utilidad del 20 %.
    """
    estrategia = obtener_estrategia(datos.proposito)
    costo_base = datos.subtotal / datos.cantidad_animales
    costo_ajustado = estrategia.ajustar(costo_base)
    margen = costo_ajustado * config.MARGEN_UTILIDAD
    costo_final = costo_ajustado + margen

    rubros = {
        "Alimentación": datos.alimentacion,
        "Mantenimiento": datos.mantenimiento,
        "Servicios": datos.servicios,
        "Impuestos": datos.impuestos,
    }
    desglose = [
        {
            "rubro": nombre,
            "valor_lote": valor,
            "valor_por_cabeza": round(valor / datos.cantidad_animales, 2),
            "porcentaje": round(valor / datos.subtotal * 100, 1),
        }
        for nombre, valor in rubros.items()
    ]
    return {
        "proposito": datos.proposito,
        "estrategia": estrategia.descripcion,
        "cantidad_animales": datos.cantidad_animales,
        "subtotal_lote": datos.subtotal,
        "costo_base_por_cabeza": round(costo_base, 2),
        "factor_manejo": estrategia.factor_manejo,
        "ajuste_manejo": round(costo_ajustado - costo_base, 2),
        "margen_porcentaje": round(config.MARGEN_UTILIDAD * 100),
        "margen_por_cabeza": round(margen, 2),
        "costo_unitario_final": round(costo_final, 2),
        "total_lote_final": round(costo_final * datos.cantidad_animales, 2),
        "desglose": desglose,
    }
