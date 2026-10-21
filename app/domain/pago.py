"""Entidad Pago: abono que el arrendatario registra sobre su contrato."""

from dataclasses import dataclass
from datetime import date

from app.domain.validaciones import (
    validar_entero,
    validar_fecha,
    validar_numero,
    validar_opcion,
)

# Mismos valores que los ENUM metodoPago y estadoPago de la tabla PAGOS.
METODOS_PAGO = ("Efectivo", "Transferencia", "PSE", "Consignacion")
PENDIENTE = "Pendiente"
CONFIRMADO = "Confirmado"
RECHAZADO = "Rechazado"
ESTADOS_PAGO = (PENDIENTE, CONFIRMADO, RECHAZADO)
# Estados a los que puede pasar un pago pendiente cuando se revisa.
ESTADOS_RESOLUCION = (CONFIRMADO, RECHAZADO)


@dataclass
class Pago:
    """Pago de un contrato con su monto, fecha, metodo y estado."""

    id_contrato: int
    fecha_pago: object
    monto_total: object
    metodo_pago: str
    estado_pago: str = PENDIENTE
    id_pago: int | None = None

    def __post_init__(self) -> None:
        """Valida los datos al registrar el pago."""
        self.id_contrato = validar_entero(
            self.id_contrato, "id_contrato", 1, 1_000_000_000
        )
        if not isinstance(self.fecha_pago, date):
            self.fecha_pago = validar_fecha(self.fecha_pago, "fecha_pago")
        self.monto_total = round(
            validar_numero(
                self.monto_total,
                "monto_total",
                0,
                10_000_000_000,
                incluir_minimo=False,
            ),
            2,
        )
        self.metodo_pago = validar_opcion(self.metodo_pago, "metodo_pago", METODOS_PAGO)
        self.estado_pago = validar_opcion(self.estado_pago, "estado_pago", ESTADOS_PAGO)


def validar_resolucion(estado: object) -> str:
    """Valida el estado al que se mueve un pago pendiente."""
    return validar_opcion(estado, "estado_pago", ESTADOS_RESOLUCION)
