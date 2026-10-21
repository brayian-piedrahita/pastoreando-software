"""Acceso a datos de la tabla RECOMENDACIONES."""

from app.domain.recomendacion import Recomendacion
from app.infrastructure.db import obtener_bd

_CONSULTA = (
    "SELECT r.*, u.nombre || ' ' || u.apellidos AS nombreTecnico "
    "FROM RECOMENDACIONES r JOIN USUARIOS u ON u.idUsuario = r.idZootecnista "
)


def _a_dict(fila) -> dict:
    return {
        "id_recomendacion": fila["idRecomendacion"],
        "id_ganado": fila["idGanado"],
        "id_zootecnista": fila["idZootecnista"],
        "nombre_tecnico": fila["nombreTecnico"],
        "fecha_recomendacion": fila["fechaRecomendacion"],
        "descripcion": fila["descripcion"],
    }


class RepositorioRecomendaciones:
    """Consultas y cambios sobre las recomendaciones de un hato."""

    def listar_por_ganado(self, id_ganado: int) -> list[dict]:
        """Devuelve las recomendaciones de un hato, las mas recientes primero."""
        with obtener_bd().conexion() as con:
            filas = con.execute(
                _CONSULTA + "WHERE r.idGanado = ? "
                "ORDER BY r.fechaRecomendacion DESC, r.idRecomendacion DESC",
                (id_ganado,),
            ).fetchall()
        return [_a_dict(f) for f in filas]

    def obtener(self, id_recomendacion: int) -> dict | None:
        """Devuelve una recomendacion por su id, o None si no existe."""
        with obtener_bd().conexion() as con:
            fila = con.execute(
                _CONSULTA + "WHERE r.idRecomendacion = ?", (id_recomendacion,)
            ).fetchone()
        return _a_dict(fila) if fila else None

    def crear(self, rec: Recomendacion) -> int:
        """Inserta una recomendacion y devuelve su id."""
        with obtener_bd().conexion() as con:
            cursor = con.execute(
                "INSERT INTO RECOMENDACIONES (idGanado, idZootecnista, "
                "fechaRecomendacion, descripcion) VALUES (?, ?, ?, ?)",
                (
                    rec.id_ganado,
                    rec.id_zootecnista,
                    rec.fecha.isoformat(),
                    rec.descripcion,
                ),
            )
            return cursor.lastrowid

    def eliminar(self, id_recomendacion: int) -> None:
        """Elimina una recomendacion."""
        with obtener_bd().conexion() as con:
            con.execute(
                "DELETE FROM RECOMENDACIONES WHERE idRecomendacion = ?",
                (id_recomendacion,),
            )
