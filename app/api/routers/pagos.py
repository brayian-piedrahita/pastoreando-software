"""Rutas de pagos de un contrato."""

from fastapi import APIRouter, Depends

from app.api.dependencias import obtener_actor
from app.api.esquemas import EstadoPagoEntrada, PagoEntrada
from app.domain.usuario import Actor
from app.services.pago_servicio import PagoServicio

router = APIRouter(prefix="/api", tags=["Pagos"])


@router.get("/contratos/{id_contrato}/pagos")
def listar_pagos(id_contrato: int, actor: Actor = Depends(obtener_actor)) -> list[dict]:
    """Lista los pagos de un contrato visible para el rol del usuario."""
    return PagoServicio().listar(actor, id_contrato)


@router.post("/contratos/{id_contrato}/pagos", status_code=201)
def registrar_pago(
    id_contrato: int, datos: PagoEntrada, actor: Actor = Depends(obtener_actor)
) -> dict:
    """El arrendatario registra un pago; queda en estado Pendiente."""
    return PagoServicio().registrar(actor, id_contrato, datos.model_dump())


@router.put("/pagos/{id_pago}/estado")
def resolver_pago(
    id_pago: int, datos: EstadoPagoEntrada, actor: Actor = Depends(obtener_actor)
) -> dict:
    """El propietario del lote o el contador confirma o rechaza un pago."""
    return PagoServicio().resolver(actor, id_pago, datos.model_dump())
