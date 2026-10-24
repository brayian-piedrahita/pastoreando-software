"""Rutas de reportes financieros."""

from fastapi import APIRouter, Depends, Response

from app.api.dependencias import obtener_actor
from app.domain.usuario import Actor
from app.services.exportacion_servicio import (
    TIPO_EXCEL,
    TIPO_PDF,
    ExportacionServicio,
    nombre_archivo,
)
from app.services.reporte_servicio import ReporteServicio

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


@router.get("/rentabilidad")
def reporte_rentabilidad(actor: Actor = Depends(obtener_actor)) -> dict:
    """Ingresos, costo estimado, utilidad y recaudo de los contratos (RF06)."""
    return ReporteServicio().rentabilidad(actor)


def _descarga(contenido: bytes, tipo: str, extension: str) -> Response:
    """Respuesta binaria que el navegador guarda como archivo."""
    cabeceras = {
        "Content-Disposition": f'attachment; filename="{nombre_archivo(extension)}"'
    }
    return Response(content=contenido, media_type=tipo, headers=cabeceras)


@router.get("/rentabilidad/excel")
def reporte_excel(actor: Actor = Depends(obtener_actor)) -> Response:
    """El mismo reporte de rentabilidad, descargable como libro de Excel."""
    reporte = ReporteServicio().rentabilidad(actor)
    return _descarga(ExportacionServicio().excel(reporte), TIPO_EXCEL, "xlsx")


@router.get("/rentabilidad/pdf")
def reporte_pdf(actor: Actor = Depends(obtener_actor)) -> Response:
    """El mismo reporte de rentabilidad, descargable como documento PDF."""
    reporte = ReporteServicio().rentabilidad(actor)
    return _descarga(ExportacionServicio().pdf(reporte), TIPO_PDF, "pdf")
