"""Casos de uso de la firma del contrato por las dos partes (RF05)."""

from datetime import datetime

from app.domain.contrato import ESTADO_ACTIVO
from app.domain.errores import AccesoDenegadoError, ConflictoError
from app.domain.usuario import ARRENDATARIO, PROPIETARIO, Actor
from app.infrastructure.repositorio_firmas import RepositorioFirmas
from app.services.contrato_servicio import ContratoServicio
from app.services.permisos import exigir_roles


class FirmaServicio:
    """Registra la firma de cada parte sobre la huella del documento."""

    def __init__(
        self,
        repo: RepositorioFirmas | None = None,
        contratos: ContratoServicio | None = None,
    ) -> None:
        self.repo = repo or RepositorioFirmas()
        self.contratos = contratos or ContratoServicio()

    def firmar(self, actor: Actor, id_contrato: int) -> dict:
        """Firma el contrato con la huella SHA-256 del texto vigente.

        Firman el propietario del lote y el arrendatario del contrato, una sola
        vez cada uno. Si despues cambia el ganado, el texto cambia y las firmas
        anteriores dejan de estar vigentes.
        """
        exigir_roles(actor, PROPIETARIO, ARRENDATARIO)
        if actor.es_consola:
            raise AccesoDenegadoError("La consola no puede firmar contratos")
        # Confirma que el contrato es de este usuario y que tiene ganado.
        detalle = self.contratos.detalle_visible(actor, id_contrato)
        if detalle["contrato"].estado != ESTADO_ACTIVO:
            raise ConflictoError("Solo se firman contratos activos")
        documento = self.contratos.generar_documento(actor, id_contrato)
        self.repo.crear(
            id_contrato,
            actor.id_usuario,
            actor.rol,
            datetime.now().isoformat(timespec="seconds"),
            documento["huella_sha256"],
        )
        return self.estado_firmas(actor, id_contrato)

    def estado_firmas(self, actor: Actor, id_contrato: int) -> dict:
        """Lista las firmas y dice si cada una sigue vigente."""
        self.contratos.detalle_visible(actor, id_contrato)
        try:
            huella_actual = self.contratos.generar_documento(actor, id_contrato)[
                "huella_sha256"
            ]
        except ConflictoError:
            huella_actual = None  # sin ganado todavia no hay documento
        firmas = self.repo.listar_por_contrato(id_contrato)
        for firma in firmas:
            firma["vigente"] = firma["huella_documento"] == huella_actual
        roles_vigentes = {f["rol_firmante"] for f in firmas if f["vigente"]}
        return {
            "id_contrato": id_contrato,
            "huella_actual": huella_actual,
            "firmas": firmas,
            "firmado_por_ambas_partes": roles_vigentes == {PROPIETARIO, ARRENDATARIO},
        }
