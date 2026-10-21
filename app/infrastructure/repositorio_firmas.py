"""Acceso a datos de la tabla FIRMAS_CONTRATO."""

import sqlite3

from app.domain.errores import ConflictoError
from app.infrastructure.db import obtener_bd


class RepositorioFirmas:
    """Consultas y altas de las firmas de un contrato."""

    def listar_por_contrato(self, id_contrato: int) -> list[dict]:
        """Devuelve las firmas de un contrato en el orden en que se hicieron."""
        with obtener_bd().conexion() as con:
            filas = con.execute(
                "SELECT f.*, u.nombre || ' ' || u.apellidos AS nombreFirmante "
                "FROM FIRMAS_CONTRATO f JOIN USUARIOS u ON u.idUsuario = f.idUsuario "
                "WHERE f.idContrato = ? ORDER BY f.idFirma",
                (id_contrato,),
            ).fetchall()
        return [
            {
                "id_firma": f["idFirma"],
                "id_usuario": f["idUsuario"],
                "nombre_firmante": f["nombreFirmante"],
                "rol_firmante": f["rolFirmante"],
                "fecha_firma": f["fechaFirma"],
                "huella_documento": f["huellaDocumento"],
            }
            for f in filas
        ]

    def crear(
        self, id_contrato: int, id_usuario: int, rol: str, fecha: str, huella: str
    ) -> int:
        """Registra la firma. Una persona solo firma una vez cada contrato."""
        try:
            with obtener_bd().conexion() as con:
                cursor = con.execute(
                    "INSERT INTO FIRMAS_CONTRATO (idContrato, idUsuario, rolFirmante, "
                    "fechaFirma, huellaDocumento) VALUES (?, ?, ?, ?, ?)",
                    (id_contrato, id_usuario, rol, fecha, huella),
                )
                return cursor.lastrowid
        except sqlite3.IntegrityError:
            raise ConflictoError("Usted ya firmó este contrato")
