"""Acceso a datos de las tablas CONTRATOS y GANADO."""

import sqlite3
from datetime import date

from app.domain.contrato import Contrato
from app.domain.errores import ConflictoError
from app.domain.ganado import Ganado
from app.infrastructure.db import obtener_bd

_TOTAL_CABEZAS = (
    "COALESCE((SELECT SUM(g.cantidadCabezas) FROM GANADO g "
    "WHERE g.idContrato = c.idContrato), 0)"
)

# Contrato con los nombres de lote, propietario y arrendatario ya unidos.
_CONSULTA_DETALLE = (
    "SELECT c.*, l.nombreLote, l.tipoPastura, l.hectareas, l.capacidadCarga, "
    "l.idPropietario, "
    "p.nombre || ' ' || p.apellidos AS nombrePropietario, "
    "p.cedula AS cedulaPropietario, "
    "a.nombre || ' ' || a.apellidos AS nombreArrendatario, "
    "a.cedula AS cedulaArrendatario, "
    f"{_TOTAL_CABEZAS} AS totalCabezas "
    "FROM CONTRATOS c "
    "JOIN LOTES l ON l.idLote = c.idLote "
    "JOIN USUARIOS p ON p.idUsuario = l.idPropietario "
    "JOIN USUARIOS a ON a.idUsuario = c.idArrendatario "
)


def _a_contrato(fila: sqlite3.Row) -> Contrato:
    """Traduce una fila de CONTRATOS a la entidad del dominio."""
    return Contrato(
        id_contrato=fila["idContrato"],
        id_arrendatario=fila["idArrendatario"],
        id_lote=fila["idLote"],
        fecha_inicio=date.fromisoformat(fila["fechaInicio"]),
        meses_duracion=fila["mesesDuracion"],
        tarifa_por_cabeza=fila["tarifaPorCabeza"],
        estado=fila["estado"],
    )


def _a_detalle(fila: sqlite3.Row) -> dict:
    """Traduce una fila de la consulta de detalle a un diccionario."""
    contrato = _a_contrato(fila)
    return {
        "contrato": contrato,
        "id_propietario": fila["idPropietario"],
        "nombre_lote": fila["nombreLote"],
        "tipo_pastura": fila["tipoPastura"],
        "hectareas": fila["hectareas"],
        "capacidad_carga": fila["capacidadCarga"],
        "nombre_propietario": fila["nombrePropietario"],
        "cedula_propietario": fila["cedulaPropietario"],
        "nombre_arrendatario": fila["nombreArrendatario"],
        "cedula_arrendatario": fila["cedulaArrendatario"],
        "total_cabezas": fila["totalCabezas"],
    }


def _a_ganado(fila: sqlite3.Row) -> Ganado:
    """Traduce una fila de GANADO a la entidad del dominio."""
    return Ganado(
        id_ganado=fila["idGanado"],
        id_contrato=fila["idContrato"],
        raza=fila["raza"],
        cantidad_cabezas=fila["cantidadCabezas"],
        proposito=fila["proposito"],
    )


class RepositorioContratos:
    """Consultas y cambios sobre contratos."""

    def listar_detalle(
        self, id_arrendatario: int | None = None, id_propietario: int | None = None
    ) -> list[dict]:
        """Lista contratos con sus datos unidos, filtrando por rol si se pide."""
        condiciones, parametros = [], []
        if id_arrendatario is not None:
            condiciones.append("c.idArrendatario = ?")
            parametros.append(id_arrendatario)
        if id_propietario is not None:
            condiciones.append("l.idPropietario = ?")
            parametros.append(id_propietario)
        donde = f"WHERE {' AND '.join(condiciones)} " if condiciones else ""
        with obtener_bd().conexion() as con:
            filas = con.execute(
                _CONSULTA_DETALLE + donde + "ORDER BY c.idContrato", parametros
            ).fetchall()
        return [_a_detalle(f) for f in filas]

    def obtener_detalle(self, id_contrato: int) -> dict | None:
        """Devuelve un contrato con sus datos unidos, o None si no existe."""
        with obtener_bd().conexion() as con:
            fila = con.execute(
                _CONSULTA_DETALLE + "WHERE c.idContrato = ?", (id_contrato,)
            ).fetchone()
        return _a_detalle(fila) if fila else None

    def crear(self, contrato: Contrato) -> int:
        """Inserta un contrato y devuelve su id."""
        with obtener_bd().conexion() as con:
            cursor = con.execute(
                "INSERT INTO CONTRATOS (idArrendatario, idLote, fechaInicio, "
                "mesesDuracion, tarifaPorCabeza, estado) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    contrato.id_arrendatario,
                    contrato.id_lote,
                    contrato.fecha_inicio.isoformat(),
                    contrato.meses_duracion,
                    contrato.tarifa_por_cabeza,
                    contrato.estado,
                ),
            )
            return cursor.lastrowid

    def actualizar(self, contrato: Contrato) -> None:
        """Actualiza las condiciones y el estado de un contrato."""
        with obtener_bd().conexion() as con:
            con.execute(
                "UPDATE CONTRATOS SET idArrendatario = ?, idLote = ?, "
                "fechaInicio = ?, mesesDuracion = ?, tarifaPorCabeza = ?, "
                "estado = ? WHERE idContrato = ?",
                (
                    contrato.id_arrendatario,
                    contrato.id_lote,
                    contrato.fecha_inicio.isoformat(),
                    contrato.meses_duracion,
                    contrato.tarifa_por_cabeza,
                    contrato.estado,
                    contrato.id_contrato,
                ),
            )

    def eliminar(self, id_contrato: int) -> None:
        """Elimina un contrato. Falla si tiene ganado (ON DELETE RESTRICT)."""
        try:
            with obtener_bd().conexion() as con:
                con.execute(
                    "DELETE FROM CONTRATOS WHERE idContrato = ?", (id_contrato,)
                )
        except sqlite3.IntegrityError:
            raise ConflictoError(
                "No se puede eliminar el contrato porque tiene ganado registrado"
            )


class RepositorioGanado:
    """Consultas y cambios sobre el ganado de un contrato."""

    def listar_por_contrato(self, id_contrato: int) -> list[Ganado]:
        """Devuelve los hatos de un contrato."""
        with obtener_bd().conexion() as con:
            filas = con.execute(
                "SELECT * FROM GANADO WHERE idContrato = ? ORDER BY idGanado",
                (id_contrato,),
            ).fetchall()
        return [_a_ganado(f) for f in filas]

    def obtener(self, id_ganado: int) -> Ganado | None:
        """Devuelve un hato por su id, o None si no existe."""
        with obtener_bd().conexion() as con:
            fila = con.execute(
                "SELECT * FROM GANADO WHERE idGanado = ?", (id_ganado,)
            ).fetchone()
        return _a_ganado(fila) if fila else None

    def crear(self, ganado: Ganado) -> int:
        """Inserta un hato y devuelve su id."""
        with obtener_bd().conexion() as con:
            cursor = con.execute(
                "INSERT INTO GANADO (idContrato, raza, cantidadCabezas, proposito) "
                "VALUES (?, ?, ?, ?)",
                (
                    ganado.id_contrato,
                    ganado.raza,
                    ganado.cantidad_cabezas,
                    ganado.proposito,
                ),
            )
            return cursor.lastrowid

    def actualizar(self, ganado: Ganado) -> None:
        """Actualiza raza, cantidad y proposito de un hato."""
        with obtener_bd().conexion() as con:
            con.execute(
                "UPDATE GANADO SET raza = ?, cantidadCabezas = ?, proposito = ? "
                "WHERE idGanado = ?",
                (
                    ganado.raza,
                    ganado.cantidad_cabezas,
                    ganado.proposito,
                    ganado.id_ganado,
                ),
            )

    def eliminar(self, id_ganado: int) -> None:
        """Elimina un hato."""
        with obtener_bd().conexion() as con:
            con.execute("DELETE FROM GANADO WHERE idGanado = ?", (id_ganado,))
