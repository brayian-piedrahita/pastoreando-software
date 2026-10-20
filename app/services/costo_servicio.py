"""Casos de uso del calculo de costos por Unidad Ganadera (RF01 y RF02)."""

from app.domain.costo import ESTRATEGIAS, DatosCosto, calcular_costo
from app.domain.usuario import ARRENDATARIO, CONTADOR, PROPIETARIO, Actor
from app.infrastructure.repositorio_costos import RepositorioCostos
from app.services.permisos import exigir_roles


class CostoServicio:
    """Calcula el costo por cabeza y guarda el historial."""

    def __init__(self, repo: RepositorioCostos | None = None) -> None:
        self.repo = repo or RepositorioCostos()

    def estrategias(self) -> list[dict]:
        """Propositos disponibles con su factor de manejo."""
        return [
            {
                "proposito": nombre,
                "factor_manejo": e.factor_manejo,
                "descripcion": e.descripcion,
            }
            for nombre, e in ESTRATEGIAS.items()
        ]

    def calcular(self, actor: Actor, datos: dict) -> dict:
        """Valida los datos, calcula el costo y lo guarda en el historial."""
        exigir_roles(actor, CONTADOR, PROPIETARIO, ARRENDATARIO)
        entrada = DatosCosto(
            alimentacion=datos.get("alimentacion"),
            mantenimiento=datos.get("mantenimiento"),
            servicios=datos.get("servicios"),
            impuestos=datos.get("impuestos"),
            cantidad_animales=datos.get("cantidad_animales"),
            proposito=datos.get("proposito"),
        )
        resultado = calcular_costo(entrada)
        # La consola no tiene usuario en la base: solo se guarda lo de la web.
        if not actor.es_consola:
            resultado["id_calculo"] = self.repo.guardar(actor.id_usuario, resultado)
        return resultado

    def historial(self, actor: Actor, limite: int = 20) -> list[dict]:
        """Ultimos calculos guardados."""
        exigir_roles(actor, CONTADOR, PROPIETARIO)
        return self.repo.listar_recientes(limite)
