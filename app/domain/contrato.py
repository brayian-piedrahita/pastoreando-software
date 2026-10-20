"""Entidad Contrato de arrendamiento y sus calculos de valor (RF05)."""

import calendar
from dataclasses import dataclass
from datetime import date

from app.domain.validaciones import (
    validar_entero,
    validar_fecha,
    validar_numero,
    validar_opcion,
)

# Mismos valores que el ENUM estado de la tabla CONTRATOS (Guia 6).
ESTADO_ACTIVO = "Activo"
ESTADO_FINALIZADO = "Finalizado"
ESTADO_ANULADO = "Anulado"
ESTADOS_CONTRATO = (ESTADO_ACTIVO, ESTADO_FINALIZADO, ESTADO_ANULADO)


def sumar_meses(fecha: date, meses: int) -> date:
    """Suma meses a una fecha ajustando el dia al ultimo del mes si hace falta."""
    indice = fecha.month - 1 + meses
    anio = fecha.year + indice // 12
    mes = indice % 12 + 1
    dia = min(fecha.day, calendar.monthrange(anio, mes)[1])
    return date(anio, mes, dia)


@dataclass
class Contrato:
    """Contrato que une a un arrendatario con un lote por una tarifa por cabeza."""

    id_arrendatario: int
    id_lote: int
    fecha_inicio: date | str
    meses_duracion: int
    tarifa_por_cabeza: float
    estado: str = ESTADO_ACTIVO
    id_contrato: int | None = None

    def __post_init__(self) -> None:
        """Valida los datos al crear o modificar el contrato."""
        self.id_arrendatario = validar_entero(
            self.id_arrendatario, "id_arrendatario", 1, 1_000_000_000
        )
        self.id_lote = validar_entero(self.id_lote, "id_lote", 1, 1_000_000_000)
        if not isinstance(self.fecha_inicio, date):
            self.fecha_inicio = validar_fecha(self.fecha_inicio, "fecha_inicio")
        self.meses_duracion = validar_entero(
            self.meses_duracion, "meses_duracion", 1, 60
        )
        self.tarifa_por_cabeza = round(
            validar_numero(
                self.tarifa_por_cabeza,
                "tarifa_por_cabeza",
                0,
                10_000_000,
                incluir_minimo=False,
            ),
            2,
        )
        self.estado = validar_opcion(self.estado, "estado", ESTADOS_CONTRATO)

    @property
    def fecha_fin(self) -> date:
        """Fecha en que termina el contrato segun su duracion."""
        return sumar_meses(self.fecha_inicio, self.meses_duracion)

    def valor_mensual(self, cabezas: int) -> float:
        """Valor que se paga cada mes: cabezas por tarifa."""
        return round(cabezas * self.tarifa_por_cabeza, 2)

    def valor_total(self, cabezas: int) -> float:
        """Valor de todo el contrato: valor mensual por meses de duracion."""
        return round(self.valor_mensual(cabezas) * self.meses_duracion, 2)
