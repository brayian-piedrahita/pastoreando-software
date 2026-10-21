"""Rutas de la firma del contrato."""

from fastapi import APIRouter, Depends

from app.api.dependencias import obtener_actor
from app.domain.usuario import Actor
from app.services.firma_servicio import FirmaServicio

router = APIRouter(prefix="/api", tags=["Firma de contratos"])


@router.post("/contratos/{id_contrato}/firma", status_code=201)
def firmar_contrato(id_contrato: int, actor: Actor = Depends(obtener_actor)) -> dict:
    """El propietario o el arrendatario firman el texto vigente del contrato."""
    return FirmaServicio().firmar(actor, id_contrato)


@router.get("/contratos/{id_contrato}/firmas")
def consultar_firmas(id_contrato: int, actor: Actor = Depends(obtener_actor)) -> dict:
    """Muestra las firmas del contrato y si siguen vigentes."""
    return FirmaServicio().estado_firmas(actor, id_contrato)
