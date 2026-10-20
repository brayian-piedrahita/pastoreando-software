"""Acceso a datos del historial de calculos de costos (RF01)."""

from datetime import datetime

from app.infrastructure.db import obtener_bd


class RepositorioCostos:
    """Guarda y consulta los calculos de costo por Unidad Ganadera."""

    def guardar(self, id_usuario: int, resultado: dict) -> int:
        """Guarda un calculo en el historial y devuelve su id."""
        with obtener_bd().conexion() as con:
            cursor = con.execute(
                "INSERT INTO HISTORIAL_COSTOS (idUsuario, fechaCalculo, proposito, "
                "cantidadAnimales, subtotalLote, costoUnitarioFinal, totalLoteFinal) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    id_usuario,
                    datetime.now().isoformat(timespec="seconds"),
                    resultado["proposito"],
                    resultado["cantidad_animales"],
                    resultado["subtotal_lote"],
                    resultado["costo_unitario_final"],
                    resultado["total_lote_final"],
                ),
            )
            return cursor.lastrowid

    def listar_recientes(self, limite: int = 20) -> list[dict]:
        """Devuelve los ultimos calculos, el mas reciente primero."""
        with obtener_bd().conexion() as con:
            filas = con.execute(
                "SELECT h.*, u.nombre || ' ' || u.apellidos AS nombreUsuario "
                "FROM HISTORIAL_COSTOS h JOIN USUARIOS u ON u.idUsuario = h.idUsuario "
                "ORDER BY h.idCalculo DESC LIMIT ?",
                (limite,),
            ).fetchall()
        return [
            {
                "id_calculo": f["idCalculo"],
                "fecha": f["fechaCalculo"],
                "usuario": f["nombreUsuario"],
                "proposito": f["proposito"],
                "cantidad_animales": f["cantidadAnimales"],
                "subtotal_lote": f["subtotalLote"],
                "costo_unitario_final": f["costoUnitarioFinal"],
                "total_lote_final": f["totalLoteFinal"],
            }
            for f in filas
        ]
