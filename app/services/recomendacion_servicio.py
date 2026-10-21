"""Casos de uso de las recomendaciones tecnicas sobre el ganado."""

from app.domain.errores import AccesoDenegadoError, NoEncontradoError
from app.domain.recomendacion import Recomendacion
from app.domain.usuario import TECNICO, Actor
from app.infrastructure.repositorio_contratos import RepositorioGanado
from app.infrastructure.repositorio_recomendaciones import RepositorioRecomendaciones
from app.services.contrato_servicio import ContratoServicio
from app.services.permisos import exigir_roles


class RecomendacionServicio:
    """El tecnico (zootecnista) deja recomendaciones sobre un hato."""

    def __init__(
        self,
        repo: RepositorioRecomendaciones | None = None,
        repo_ganado: RepositorioGanado | None = None,
        contratos: ContratoServicio | None = None,
    ) -> None:
        self.repo = repo or RepositorioRecomendaciones()
        self.repo_ganado = repo_ganado or RepositorioGanado()
        self.contratos = contratos or ContratoServicio()

    def _hato(self, id_ganado: int):
        hato = self.repo_ganado.obtener(id_ganado)
        if hato is None:
            raise NoEncontradoError(f"No existe el hato {id_ganado}")
        return hato

    def listar(self, actor: Actor, id_ganado: int) -> list[dict]:
        """Lista las recomendaciones de un hato de un contrato visible."""
        hato = self._hato(id_ganado)
        self.contratos.detalle_visible(actor, hato.id_contrato)
        return self.repo.listar_por_ganado(id_ganado)

    def crear(self, actor: Actor, id_ganado: int, datos: dict) -> dict:
        """Registra una recomendacion. Solo un tecnico con sesion abierta."""
        exigir_roles(actor, TECNICO)
        if actor.es_consola:
            raise AccesoDenegadoError(
                "Solo un técnico con sesión puede registrar recomendaciones"
            )
        self._hato(id_ganado)
        rec = Recomendacion(
            id_ganado=id_ganado,
            id_zootecnista=actor.id_usuario,
            descripcion=datos.get("descripcion"),
        )
        rec.id_recomendacion = self.repo.crear(rec)
        return self.repo.obtener(rec.id_recomendacion)

    def eliminar(self, actor: Actor, id_recomendacion: int) -> None:
        """Elimina una recomendacion. Solo su autor."""
        exigir_roles(actor, TECNICO)
        rec = self.repo.obtener(id_recomendacion)
        if rec is None:
            raise NoEncontradoError(f"No existe la recomendación {id_recomendacion}")
        if not actor.es_consola and rec["id_zootecnista"] != actor.id_usuario:
            raise AccesoDenegadoError("La recomendación es de otro técnico")
        self.repo.eliminar(id_recomendacion)
