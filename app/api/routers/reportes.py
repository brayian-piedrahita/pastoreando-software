"""Rutas de reportes financieros."""

from fastapi import APIRouter, Depends

from app.api.dependencias import obtener_actor
from app.domain.usuario import Actor
from app.services.reporte_servicio import ReporteServicio

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


@router.get("/rentabilidad")
def reporte_rentabilidad(actor: Actor = Depends(obtener_actor)) -> dict:
    """Ingresos, costo estimado, utilidad y recaudo de los contratos (RF06)."""
    return ReporteServicio().rentabilidad(actor)
