"""Rutas de contratos y de su ganado."""

from fastapi import APIRouter, Depends, Response

from app.api.dependencias import obtener_actor
from app.api.esquemas import ContratoEntrada, GanadoEntrada
from app.domain.usuario import Actor
from app.services.contrato_servicio import ContratoServicio
from app.services.ganado_servicio import GanadoServicio

router = APIRouter(prefix="/api", tags=["Contratos y ganado"])


@router.get("/contratos")
def listar_contratos(actor: Actor = Depends(obtener_actor)) -> list[dict]:
    """Lista los contratos visibles para el rol del usuario."""
    return ContratoServicio().listar(actor)


@router.get("/contratos/{id_contrato}")
def obtener_contrato(id_contrato: int, actor: Actor = Depends(obtener_actor)) -> dict:
    """Devuelve un contrato con sus valores calculados."""
    return ContratoServicio().obtener(actor, id_contrato)


@router.post("/contratos", status_code=201)
def crear_contrato(
    datos: ContratoEntrada, actor: Actor = Depends(obtener_actor)
) -> dict:
    """Crea un contrato de arrendamiento."""
    return ContratoServicio().crear(actor, datos.model_dump(exclude_none=True))


@router.put("/contratos/{id_contrato}")
def actualizar_contrato(
    id_contrato: int, datos: ContratoEntrada, actor: Actor = Depends(obtener_actor)
) -> dict:
    """Modifica condiciones o estado del contrato."""
    campos = datos.model_dump(exclude_unset=True)
    return ContratoServicio().actualizar(actor, id_contrato, campos)


@router.delete("/contratos/{id_contrato}", status_code=204)
def eliminar_contrato(
    id_contrato: int, actor: Actor = Depends(obtener_actor)
) -> Response:
    """Elimina un contrato sin ganado."""
    ContratoServicio().eliminar(actor, id_contrato)
    return Response(status_code=204)


@router.get("/contratos/{id_contrato}/documento")
def documento_contrato(id_contrato: int, actor: Actor = Depends(obtener_actor)) -> dict:
    """Genera el texto del contrato con su huella SHA-256."""
    return ContratoServicio().generar_documento(actor, id_contrato)


@router.get("/contratos/{id_contrato}/ganado")
def listar_ganado(
    id_contrato: int, actor: Actor = Depends(obtener_actor)
) -> list[dict]:
    """Lista el ganado de un contrato."""
    return GanadoServicio().listar(actor, id_contrato)


@router.post("/contratos/{id_contrato}/ganado", status_code=201)
def crear_ganado(
    id_contrato: int, datos: GanadoEntrada, actor: Actor = Depends(obtener_actor)
) -> dict:
    """Registra un hato y devuelve la alerta de carga del lote."""
    return GanadoServicio().crear(actor, id_contrato, datos.model_dump())


@router.put("/ganado/{id_ganado}")
def actualizar_ganado(
    id_ganado: int, datos: GanadoEntrada, actor: Actor = Depends(obtener_actor)
) -> dict:
    """Modifica un hato propio."""
    campos = datos.model_dump(exclude_unset=True)
    return GanadoServicio().actualizar(actor, id_ganado, campos)


@router.delete("/ganado/{id_ganado}", status_code=204)
def eliminar_ganado(id_ganado: int, actor: Actor = Depends(obtener_actor)) -> Response:
    """Elimina un hato propio."""
    GanadoServicio().eliminar(actor, id_ganado)
    return Response(status_code=204)
