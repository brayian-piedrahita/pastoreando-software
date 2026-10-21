"""Acceso a datos de la tabla PAGOS."""

import sqlite3
from datetime import date

from app.domain.pago import Pago
from app.infrastructure.db import obtener_bd


def _a_pago(fila: sqlite3.Row) -> Pago:
    return Pago(
        id_pago=fila["idPago"],
        id_contrato=fila["idContrato"],
        fecha_pago=date.fromisoformat(fila["fechaPago"]),
        monto_total=fila["montoTotal"],
        metodo_pago=fila["metodoPago"],
        estado_pago=fila["estadoPago"],
    )


class RepositorioPagos:
    """Consultas y cambios sobre los pagos. Todas usan marcadores ?."""

    def listar_por_contrato(self, id_contrato: int) -> list[Pago]:
        """Devuelve los pagos de un contrato, del mas antiguo al mas reciente."""
        with obtener_bd().conexion() as con:
            filas = con.execute(
                "SELECT * FROM PAGOS WHERE idContrato = ? ORDER BY fechaPago, idPago",
                (id_contrato,),
            ).fetchall()
        return [_a_pago(f) for f in filas]

    def obtener(self, id_pago: int) -> Pago | None:
        """Devuelve un pago por su id, o None si no existe."""
        with obtener_bd().conexion() as con:
            fila = con.execute(
                "SELECT * FROM PAGOS WHERE idPago = ?", (id_pago,)
            ).fetchone()
        return _a_pago(fila) if fila else None

    def crear(self, pago: Pago) -> int:
        """Inserta un pago y devuelve su id."""
        with obtener_bd().conexion() as con:
            cursor = con.execute(
                "INSERT INTO PAGOS (idContrato, fechaPago, montoTotal, metodoPago, "
                "estadoPago) VALUES (?, ?, ?, ?, ?)",
                (
                    pago.id_contrato,
                    pago.fecha_pago.isoformat(),
                    pago.monto_total,
                    pago.metodo_pago,
                    pago.estado_pago,
                ),
            )
            return cursor.lastrowid

    def cambiar_estado(self, id_pago: int, estado: str) -> None:
        """Cambia el estado de un pago."""
        with obtener_bd().conexion() as con:
            con.execute(
                "UPDATE PAGOS SET estadoPago = ? WHERE idPago = ?", (estado, id_pago)
            )

    def recaudado_por_contrato(self) -> dict[int, float]:
        """Suma de los pagos confirmados de cada contrato (para el reporte)."""
        with obtener_bd().conexion() as con:
            filas = con.execute(
                "SELECT idContrato, SUM(montoTotal) AS total FROM PAGOS "
                "WHERE estadoPago = 'Confirmado' GROUP BY idContrato"
            ).fetchall()
        return {f["idContrato"]: f["total"] for f in filas}
