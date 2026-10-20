"""Rutas del calculo de costos por Unidad Ganadera."""

from fastapi import APIRouter, Depends

from app.api.dependencias import obtener_actor
from app.api.esquemas import CostoEntrada
from app.domain.usuario import Actor
from app.services.costo_servicio import CostoServicio

router = APIRouter(prefix="/api/costos", tags=["Costos"])


@router.get("/estrategias")
def estrategias(_: Actor = Depends(obtener_actor)) -> list[dict]:
    """Propositos disponibles y su factor de manejo."""
    return CostoServicio().estrategias()


@router.post("/calcular")
def calcular(datos: CostoEntrada, actor: Actor = Depends(obtener_actor)) -> dict:
    """Calcula el costo por cabeza con su desglose."""
    return CostoServicio().calcular(actor, datos.model_dump())


@router.get("/historial")
def historial(actor: Actor = Depends(obtener_actor)) -> list[dict]:
    """Ultimos calculos guardados."""
    return CostoServicio().historial(actor)
