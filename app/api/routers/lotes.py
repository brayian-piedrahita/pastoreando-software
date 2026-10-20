"""Rutas de lotes y alerta de sobrecarga."""

from fastapi import APIRouter, Depends, Response

from app.api.dependencias import obtener_actor
from app.api.esquemas import LoteEntrada
from app.domain.usuario import Actor
from app.services.lote_servicio import LoteServicio

router = APIRouter(prefix="/api/lotes", tags=["Lotes"])


@router.get("")
def listar_lotes(_: Actor = Depends(obtener_actor)) -> list[dict]:
    """Lista los lotes con su estado de carga."""
    return LoteServicio().listar()


@router.get("/{id_lote}")
def obtener_lote(id_lote: int, _: Actor = Depends(obtener_actor)) -> dict:
    """Devuelve un lote con su alerta de carga."""
    return LoteServicio().obtener(id_lote)


@router.post("", status_code=201)
def crear_lote(datos: LoteEntrada, actor: Actor = Depends(obtener_actor)) -> dict:
    """Registra un lote del propietario autenticado."""
    return LoteServicio().crear(actor, datos.model_dump())


@router.put("/{id_lote}")
def actualizar_lote(
    id_lote: int, datos: LoteEntrada, actor: Actor = Depends(obtener_actor)
) -> dict:
    """Modifica los campos enviados de un lote propio."""
    return LoteServicio().actualizar(
        actor, id_lote, datos.model_dump(exclude_unset=True)
    )


@router.delete("/{id_lote}", status_code=204)
def eliminar_lote(id_lote: int, actor: Actor = Depends(obtener_actor)) -> Response:
    """Elimina un lote propio que no tenga contratos."""
    LoteServicio().eliminar(actor, id_lote)
    return Response(status_code=204)
