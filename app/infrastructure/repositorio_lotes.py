"""Acceso a datos de la tabla LOTES."""

from app.domain.errores import ConflictoError
from app.domain.lote import Lote
from app.infrastructure.db import ErrorIntegridad, FilaBD, obtener_bd

# Carga actual: cabezas de los contratos ACTIVOS del lote. Un contrato
# finalizado o anulado ya no ocupa el potrero.
_CARGA_ACTUAL = (
    "COALESCE((SELECT SUM(g.cantidadCabezas) FROM GANADO g "
    "JOIN CONTRATOS c ON c.idContrato = g.idContrato "
    "WHERE c.idLote = l.idLote AND c.estado = 'Activo'), 0)"
)


def _a_lote(fila: FilaBD) -> Lote:
    """Traduce una fila de LOTES a la entidad del dominio."""
    return Lote(
        id_lote=fila["idLote"],
        id_propietario=fila["idPropietario"],
        nombre_lote=fila["nombreLote"],
        hectareas=fila["hectareas"],
        capacidad_carga=fila["capacidadCarga"],
        tipo_pastura=fila["tipoPastura"],
    )


class RepositorioLotes:
    """Consultas y cambios sobre lotes."""

    def listar_con_carga(self) -> list[tuple[Lote, int]]:
        """Devuelve cada lote junto con su carga actual en cabezas."""
        with obtener_bd().conexion() as con:
            filas = con.execute(
                f"SELECT l.*, {_CARGA_ACTUAL} AS cargaActual "
                "FROM LOTES l ORDER BY l.idLote"
            ).fetchall()
        return [(_a_lote(f), f["cargaActual"]) for f in filas]

    def obtener_con_carga(self, id_lote: int) -> tuple[Lote, int] | None:
        """Devuelve un lote con su carga actual, o None si no existe."""
        with obtener_bd().conexion() as con:
            fila = con.execute(
                f"SELECT l.*, {_CARGA_ACTUAL} AS cargaActual "
                "FROM LOTES l WHERE l.idLote = ?",
                (id_lote,),
            ).fetchone()
        return (_a_lote(fila), fila["cargaActual"]) if fila else None

    def crear(self, lote: Lote) -> int:
        """Inserta un lote y devuelve su id."""
        with obtener_bd().conexion() as con:
            cursor = con.execute(
                "INSERT INTO LOTES "
                "(idPropietario, nombreLote, hectareas, capacidadCarga, tipoPastura) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    lote.id_propietario,
                    lote.nombre_lote,
                    lote.hectareas,
                    lote.capacidad_carga,
                    lote.tipo_pastura,
                ),
            )
            return cursor.lastrowid

    def actualizar(self, lote: Lote) -> None:
        """Actualiza los datos de un lote existente."""
        with obtener_bd().conexion() as con:
            con.execute(
                "UPDATE LOTES SET nombreLote = ?, hectareas = ?, "
                "capacidadCarga = ?, tipoPastura = ? WHERE idLote = ?",
                (
                    lote.nombre_lote,
                    lote.hectareas,
                    lote.capacidad_carga,
                    lote.tipo_pastura,
                    lote.id_lote,
                ),
            )

    def eliminar(self, id_lote: int) -> None:
        """Elimina un lote. Falla si tiene contratos (ON DELETE RESTRICT)."""
        try:
            with obtener_bd().conexion() as con:
                con.execute("DELETE FROM LOTES WHERE idLote = ?", (id_lote,))
        except ErrorIntegridad:
            raise ConflictoError(
                "No se puede eliminar el lote porque tiene contratos asociados"
            )
