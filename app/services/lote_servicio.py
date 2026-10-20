"""Casos de uso de lotes y alerta de sobrecarga (RF04)."""

from app.domain.errores import AccesoDenegadoError, NoEncontradoError
from app.domain.lote import Lote
from app.domain.usuario import PROPIETARIO, Actor
from app.infrastructure.repositorio_lotes import RepositorioLotes
from app.services.permisos import exigir_roles


def _presentar(lote: Lote, cabezas: int) -> dict:
    """Une los datos del lote con su estado de carga."""
    return {
        "id_lote": lote.id_lote,
        "id_propietario": lote.id_propietario,
        "nombre_lote": lote.nombre_lote,
        "hectareas": lote.hectareas,
        "capacidad_carga": lote.capacidad_carga,
        "tipo_pastura": lote.tipo_pastura,
        "estado_carga": lote.evaluar_carga(cabezas).a_dict(),
    }


class LoteServicio:
    """Alta, consulta, edicion y baja de lotes."""

    def __init__(self, repo: RepositorioLotes | None = None) -> None:
        self.repo = repo or RepositorioLotes()

    def listar(self) -> list[dict]:
        """Lista todos los lotes con su estado de carga."""
        return [
            _presentar(lote, cabezas) for lote, cabezas in self.repo.listar_con_carga()
        ]

    def obtener(self, id_lote: int) -> dict:
        """Devuelve un lote con su estado de carga."""
        lote, cabezas = self._buscar(id_lote)
        return _presentar(lote, cabezas)

    def crear(self, actor: Actor, datos: dict) -> dict:
        """Crea un lote. El propietario es quien lo registra."""
        exigir_roles(actor, PROPIETARIO)
        if actor.es_consola:
            id_propietario = datos.get("id_propietario")
        else:
            id_propietario = actor.id_usuario
        lote = Lote(
            id_propietario=id_propietario,
            nombre_lote=datos.get("nombre_lote"),
            hectareas=datos.get("hectareas"),
            capacidad_carga=datos.get("capacidad_carga"),
            tipo_pastura=datos.get("tipo_pastura"),
        )
        lote.id_lote = self.repo.crear(lote)
        return _presentar(lote, 0)

    def actualizar(self, actor: Actor, id_lote: int, datos: dict) -> dict:
        """Modifica un lote. Solo su propietario puede hacerlo."""
        actual, cabezas = self._buscar(id_lote)
        self._exigir_propietario(actor, actual)
        nuevo = Lote(
            id_lote=id_lote,
            id_propietario=actual.id_propietario,
            nombre_lote=datos.get("nombre_lote", actual.nombre_lote),
            hectareas=datos.get("hectareas", actual.hectareas),
            capacidad_carga=datos.get("capacidad_carga", actual.capacidad_carga),
            tipo_pastura=datos.get("tipo_pastura", actual.tipo_pastura),
        )
        self.repo.actualizar(nuevo)
        return _presentar(nuevo, cabezas)

    def eliminar(self, actor: Actor, id_lote: int) -> None:
        """Elimina un lote sin contratos. Solo su propietario puede hacerlo."""
        actual, _ = self._buscar(id_lote)
        self._exigir_propietario(actor, actual)
        self.repo.eliminar(id_lote)

    def _buscar(self, id_lote: int) -> tuple[Lote, int]:
        resultado = self.repo.obtener_con_carga(id_lote)
        if resultado is None:
            raise NoEncontradoError(f"No existe el lote {id_lote}")
        return resultado

    @staticmethod
    def _exigir_propietario(actor: Actor, lote: Lote) -> None:
        exigir_roles(actor, PROPIETARIO)
        if not actor.es_consola and lote.id_propietario != actor.id_usuario:
            raise AccesoDenegadoError("El lote pertenece a otro propietario")
