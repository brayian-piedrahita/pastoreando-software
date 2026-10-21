"""Reporte de rentabilidad por contrato con margen de utilidad (RF06)."""

from app import config
from app.domain.contrato import Contrato
from app.domain.usuario import CONTADOR, PROPIETARIO, Actor
from app.infrastructure.repositorio_contratos import RepositorioContratos
from app.infrastructure.repositorio_pagos import RepositorioPagos
from app.services.permisos import exigir_roles

ESTADO_ANULADO = "Anulado"


class ReporteServicio:
    """Proyecta ingresos, costo estimado y utilidad de los contratos."""

    def __init__(
        self,
        repo_contratos: RepositorioContratos | None = None,
        repo_pagos: RepositorioPagos | None = None,
    ) -> None:
        self.repo_contratos = repo_contratos or RepositorioContratos()
        self.repo_pagos = repo_pagos or RepositorioPagos()

    def rentabilidad(self, actor: Actor) -> dict:
        """Calcula la rentabilidad de los contratos que el actor puede ver.

        La tarifa del arriendo ya incluye el margen de utilidad sobre el costo
        (RF01), asi que el costo estimado es el ingreso dividido por 1 + margen,
        y la utilidad proyectada es la diferencia. El recaudado suma solo los
        pagos confirmados; el saldo por cobrar es lo que falta del valor total.
        """
        exigir_roles(actor, PROPIETARIO, CONTADOR)
        solo_propios = actor.id_usuario if actor.rol == PROPIETARIO else None
        if actor.es_consola:
            solo_propios = None
        detalles = self.repo_contratos.listar_detalle(None, solo_propios)
        recaudos = self.repo_pagos.recaudado_por_contrato()
        filas = []
        for d in detalles:
            c: Contrato = d["contrato"]
            if c.estado == ESTADO_ANULADO:
                continue
            ingreso = c.valor_total(d["total_cabezas"])
            costo = round(ingreso / (1 + config.MARGEN_UTILIDAD), 2)
            recaudado = round(recaudos.get(c.id_contrato, 0.0), 2)
            filas.append(
                {
                    "id_contrato": c.id_contrato,
                    "nombre_lote": d["nombre_lote"],
                    "estado": c.estado,
                    "total_cabezas": d["total_cabezas"],
                    "ingreso_total": ingreso,
                    "costo_estimado": costo,
                    "utilidad_proyectada": round(ingreso - costo, 2),
                    "recaudado": recaudado,
                    "saldo_por_cobrar": max(round(ingreso - recaudado, 2), 0.0),
                }
            )
        campos = (
            "ingreso_total",
            "costo_estimado",
            "utilidad_proyectada",
            "recaudado",
            "saldo_por_cobrar",
        )
        totales = {campo: round(sum(f[campo] for f in filas), 2) for campo in campos}
        return {
            "margen_utilidad": config.MARGEN_UTILIDAD,
            "contratos": filas,
            "totales": totales,
        }
