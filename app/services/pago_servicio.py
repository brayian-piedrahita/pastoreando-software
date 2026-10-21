"""Casos de uso de los pagos de un contrato."""

from app.domain.contrato import ESTADO_ACTIVO
from app.domain.errores import AccesoDenegadoError, ConflictoError, NoEncontradoError
from app.domain.pago import PENDIENTE, Pago, validar_resolucion
from app.domain.usuario import ARRENDATARIO, CONTADOR, PROPIETARIO, Actor
from app.infrastructure.repositorio_pagos import RepositorioPagos
from app.services.contrato_servicio import ContratoServicio
from app.services.permisos import exigir_roles


def _presentar(pago: Pago) -> dict:
    return {
        "id_pago": pago.id_pago,
        "id_contrato": pago.id_contrato,
        "fecha_pago": pago.fecha_pago.isoformat(),
        "monto_total": pago.monto_total,
        "metodo_pago": pago.metodo_pago,
        "estado_pago": pago.estado_pago,
    }


class PagoServicio:
    """El arrendatario registra sus pagos y el propietario o contador los revisa."""

    def __init__(
        self,
        repo: RepositorioPagos | None = None,
        contratos: ContratoServicio | None = None,
    ) -> None:
        self.repo = repo or RepositorioPagos()
        self.contratos = contratos or ContratoServicio()

    def listar(self, actor: Actor, id_contrato: int) -> list[dict]:
        """Lista los pagos de un contrato visible para el actor."""
        self.contratos.detalle_visible(actor, id_contrato)
        return [_presentar(p) for p in self.repo.listar_por_contrato(id_contrato)]

    def registrar(self, actor: Actor, id_contrato: int, datos: dict) -> dict:
        """Registra un pago en estado Pendiente. Solo el arrendatario del contrato."""
        exigir_roles(actor, ARRENDATARIO)
        detalle = self.contratos.detalle_visible(actor, id_contrato)
        contrato = detalle["contrato"]
        if not actor.es_consola and contrato.id_arrendatario != actor.id_usuario:
            raise AccesoDenegadoError("El contrato pertenece a otro arrendatario")
        if contrato.estado != ESTADO_ACTIVO:
            raise ConflictoError("Solo se registran pagos en contratos activos")
        pago = Pago(
            id_contrato=id_contrato,
            fecha_pago=datos.get("fecha_pago"),
            monto_total=datos.get("monto_total"),
            metodo_pago=datos.get("metodo_pago"),
        )
        pago.id_pago = self.repo.crear(pago)
        return _presentar(pago)

    def resolver(self, actor: Actor, id_pago: int, datos: dict) -> dict:
        """Confirma o rechaza un pago pendiente (propietario del lote o contador)."""
        exigir_roles(actor, PROPIETARIO, CONTADOR)
        pago = self.repo.obtener(id_pago)
        if pago is None:
            raise NoEncontradoError(f"No existe el pago {id_pago}")
        # Para el propietario esta consulta confirma que el contrato es de su lote.
        self.contratos.detalle_visible(actor, pago.id_contrato)
        nuevo_estado = validar_resolucion(datos.get("estado_pago"))
        if pago.estado_pago != PENDIENTE:
            raise ConflictoError("El pago ya fue resuelto y no se puede cambiar")
        self.repo.cambiar_estado(id_pago, nuevo_estado)
        pago.estado_pago = nuevo_estado
        return _presentar(pago)
