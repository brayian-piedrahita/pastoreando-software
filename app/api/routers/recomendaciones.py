"""Rutas de recomendaciones tecnicas sobre el ganado."""

from fastapi import APIRouter, Depends, Response

from app.api.dependencias import obtener_actor
from app.api.esquemas import RecomendacionEntrada
from app.domain.usuario import Actor
from app.services.recomendacion_servicio import RecomendacionServicio

router = APIRouter(prefix="/api", tags=["Recomendaciones"])


@router.get("/ganado/{id_ganado}/recomendaciones")
def listar_recomendaciones(
    id_ganado: int, actor: Actor = Depends(obtener_actor)
) -> list[dict]:
    """Lista las recomendaciones de un hato."""
    return RecomendacionServicio().listar(actor, id_ganado)


@router.post("/ganado/{id_ganado}/recomendaciones", status_code=201)
def crear_recomendacion(
    id_ganado: int, datos: RecomendacionEntrada, actor: Actor = Depends(obtener_actor)
) -> dict:
    """El tecnico registra una recomendacion sobre un hato."""
    return RecomendacionServicio().crear(actor, id_ganado, datos.model_dump())


@router.delete("/recomendaciones/{id_recomendacion}", status_code=204)
def eliminar_recomendacion(
    id_recomendacion: int, actor: Actor = Depends(obtener_actor)
) -> Response:
    """El tecnico autor elimina su recomendacion."""
    RecomendacionServicio().eliminar(actor, id_recomendacion)
    return Response(status_code=204)
