"""Casos de uso del ganado de un contrato."""

from app.domain.contrato import ESTADO_ACTIVO, Contrato
from app.domain.errores import AccesoDenegadoError, ConflictoError, NoEncontradoError
from app.domain.ganado import Ganado
from app.domain.usuario import ARRENDATARIO, Actor
from app.infrastructure.repositorio_contratos import RepositorioGanado
from app.infrastructure.repositorio_lotes import RepositorioLotes
from app.services.contrato_servicio import ContratoServicio
from app.services.permisos import exigir_roles


def _presentar(ganado: Ganado) -> dict:
    return {
        "id_ganado": ganado.id_ganado,
        "id_contrato": ganado.id_contrato,
        "raza": ganado.raza,
        "cantidad_cabezas": ganado.cantidad_cabezas,
        "proposito": ganado.proposito,
    }


class GanadoServicio:
    """Registro del ganado que el arrendatario lleva al lote."""

    def __init__(
        self,
        repo: RepositorioGanado | None = None,
        contratos: ContratoServicio | None = None,
        repo_lotes: RepositorioLotes | None = None,
    ) -> None:
        self.repo = repo or RepositorioGanado()
        self.contratos = contratos or ContratoServicio()
        self.repo_lotes = repo_lotes or RepositorioLotes()

    def listar(self, actor: Actor, id_contrato: int) -> list[dict]:
        """Lista los hatos de un contrato visible para el actor."""
        self.contratos.detalle_visible(actor, id_contrato)
        return [_presentar(g) for g in self.repo.listar_por_contrato(id_contrato)]

    def crear(self, actor: Actor, id_contrato: int, datos: dict) -> dict:
        """Registra un hato y devuelve junto con el la alerta de carga del lote."""
        contrato = self._contrato_del_arrendatario(actor, id_contrato)
        if contrato.estado != ESTADO_ACTIVO:
            raise ConflictoError("Solo se registra ganado en contratos activos")
        ganado = Ganado(
            id_contrato=id_contrato,
            raza=datos.get("raza"),
            cantidad_cabezas=datos.get("cantidad_cabezas"),
            proposito=datos.get("proposito"),
        )
        ganado.id_ganado = self.repo.crear(ganado)
        return self._con_alerta(ganado, contrato.id_lote)

    def actualizar(self, actor: Actor, id_ganado: int, datos: dict) -> dict:
        """Modifica un hato propio."""
        actual = self._buscar(id_ganado)
        contrato = self._contrato_del_arrendatario(actor, actual.id_contrato)
        nuevo = Ganado(
            id_ganado=id_ganado,
            id_contrato=actual.id_contrato,
            raza=datos.get("raza", actual.raza),
            cantidad_cabezas=datos.get("cantidad_cabezas", actual.cantidad_cabezas),
            proposito=datos.get("proposito", actual.proposito),
        )
        self.repo.actualizar(nuevo)
        return self._con_alerta(nuevo, contrato.id_lote)

    def eliminar(self, actor: Actor, id_ganado: int) -> None:
        """Elimina un hato propio."""
        actual = self._buscar(id_ganado)
        self._contrato_del_arrendatario(actor, actual.id_contrato)
        self.repo.eliminar(id_ganado)

    def _buscar(self, id_ganado: int) -> Ganado:
        ganado = self.repo.obtener(id_ganado)
        if ganado is None:
            raise NoEncontradoError(f"No existe el registro de ganado {id_ganado}")
        return ganado

    def _contrato_del_arrendatario(self, actor: Actor, id_contrato: int) -> Contrato:
        exigir_roles(actor, ARRENDATARIO)
        detalle = self.contratos.detalle_visible(actor, id_contrato)
        contrato: Contrato = detalle["contrato"]
        if not actor.es_consola and contrato.id_arrendatario != actor.id_usuario:
            raise AccesoDenegadoError("El contrato pertenece a otro arrendatario")
        return contrato

    def _con_alerta(self, ganado: Ganado, id_lote: int) -> dict:
        """Respuesta del hato mas el estado de carga ya recalculado del lote."""
        lote, cabezas = self.repo_lotes.obtener_con_carga(id_lote)
        respuesta = _presentar(ganado)
        respuesta["estado_carga"] = lote.evaluar_carga(cabezas).a_dict()
        return respuesta
