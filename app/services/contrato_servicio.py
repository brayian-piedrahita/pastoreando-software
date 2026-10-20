"""Casos de uso de contratos de arrendamiento (RF05)."""

import hashlib

from app.domain.contrato import ESTADO_ACTIVO, Contrato
from app.domain.errores import (
    AccesoDenegadoError,
    ConflictoError,
    NoEncontradoError,
    ValidacionError,
)
from app.domain.usuario import ARRENDATARIO, PROPIETARIO, Actor
from app.infrastructure.repositorio_contratos import RepositorioContratos
from app.infrastructure.repositorio_lotes import RepositorioLotes
from app.infrastructure.repositorio_usuarios import RepositorioUsuarios
from app.services.permisos import exigir_roles


def puede_ver(actor: Actor, detalle: dict) -> bool:
    """Propietario y arrendatario ven sus contratos; tecnico y contador, todos."""
    if actor.es_consola or actor.rol not in (PROPIETARIO, ARRENDATARIO):
        return True
    contrato: Contrato = detalle["contrato"]
    if actor.rol == PROPIETARIO:
        return detalle["id_propietario"] == actor.id_usuario
    return contrato.id_arrendatario == actor.id_usuario


def _presentar(detalle: dict) -> dict:
    """Convierte el detalle del repositorio en la respuesta de la API."""
    c: Contrato = detalle["contrato"]
    cabezas = detalle["total_cabezas"]
    return {
        "id_contrato": c.id_contrato,
        "id_lote": c.id_lote,
        "nombre_lote": detalle["nombre_lote"],
        "id_arrendatario": c.id_arrendatario,
        "nombre_arrendatario": detalle["nombre_arrendatario"],
        "nombre_propietario": detalle["nombre_propietario"],
        "fecha_inicio": c.fecha_inicio.isoformat(),
        "fecha_fin": c.fecha_fin.isoformat(),
        "meses_duracion": c.meses_duracion,
        "tarifa_por_cabeza": c.tarifa_por_cabeza,
        "estado": c.estado,
        "total_cabezas": cabezas,
        "valor_mensual": c.valor_mensual(cabezas),
        "valor_total": c.valor_total(cabezas),
    }


def _moneda(valor: float) -> str:
    """Formatea pesos colombianos: 1.234.567."""
    return f"{valor:,.0f}".replace(",", ".")


class ContratoServicio:
    """Alta, consulta, edicion y baja de contratos."""

    def __init__(
        self,
        repo: RepositorioContratos | None = None,
        repo_lotes: RepositorioLotes | None = None,
        repo_usuarios: RepositorioUsuarios | None = None,
    ) -> None:
        self.repo = repo or RepositorioContratos()
        self.repo_lotes = repo_lotes or RepositorioLotes()
        self.repo_usuarios = repo_usuarios or RepositorioUsuarios()

    def listar(self, actor: Actor) -> list[dict]:
        """Lista los contratos que el actor puede ver."""
        filtro_arrendatario = actor.id_usuario if actor.rol == ARRENDATARIO else None
        filtro_propietario = actor.id_usuario if actor.rol == PROPIETARIO else None
        if actor.es_consola:
            filtro_arrendatario = filtro_propietario = None
        detalles = self.repo.listar_detalle(filtro_arrendatario, filtro_propietario)
        return [_presentar(d) for d in detalles]

    def obtener(self, actor: Actor, id_contrato: int) -> dict:
        """Devuelve un contrato visible para el actor."""
        return _presentar(self.detalle_visible(actor, id_contrato))

    def detalle_visible(self, actor: Actor, id_contrato: int) -> dict:
        """Busca el contrato y confirma que el actor puede verlo."""
        detalle = self.repo.obtener_detalle(id_contrato)
        if detalle is None:
            raise NoEncontradoError(f"No existe el contrato {id_contrato}")
        if not puede_ver(actor, detalle):
            raise AccesoDenegadoError("El contrato pertenece a otras personas")
        return detalle

    def crear(self, actor: Actor, datos: dict) -> dict:
        """Crea un contrato. El arrendatario solo puede crearlo a su nombre."""
        exigir_roles(actor, PROPIETARIO, ARRENDATARIO)
        if actor.rol == ARRENDATARIO:
            id_arrendatario = actor.id_usuario
        else:
            id_arrendatario = datos.get("id_arrendatario")
        contrato = Contrato(
            id_arrendatario=id_arrendatario,
            id_lote=datos.get("id_lote"),
            fecha_inicio=datos.get("fecha_inicio"),
            meses_duracion=datos.get("meses_duracion"),
            tarifa_por_cabeza=datos.get("tarifa_por_cabeza"),
            estado=datos.get("estado", ESTADO_ACTIVO),
        )
        encontrado = self.repo_lotes.obtener_con_carga(contrato.id_lote)
        if encontrado is None:
            raise NoEncontradoError(f"No existe el lote {contrato.id_lote}", "id_lote")
        lote, _ = encontrado
        if actor.rol == PROPIETARIO and lote.id_propietario != actor.id_usuario:
            raise AccesoDenegadoError("El lote pertenece a otro propietario")
        arrendatario = self.repo_usuarios.obtener(contrato.id_arrendatario)
        if arrendatario is None or arrendatario["rol"] != ARRENDATARIO:
            raise ValidacionError(
                "El usuario indicado no es un arrendatario", "id_arrendatario"
            )
        contrato.id_contrato = self.repo.crear(contrato)
        return self.obtener(actor, contrato.id_contrato)

    def actualizar(self, actor: Actor, id_contrato: int, datos: dict) -> dict:
        """Modifica condiciones o estado del contrato. Solo el propietario del lote."""
        detalle = self._detalle_del_propietario(actor, id_contrato)
        actual: Contrato = detalle["contrato"]
        nuevo = Contrato(
            id_contrato=id_contrato,
            id_arrendatario=actual.id_arrendatario,
            id_lote=actual.id_lote,
            fecha_inicio=datos.get("fecha_inicio", actual.fecha_inicio),
            meses_duracion=datos.get("meses_duracion", actual.meses_duracion),
            tarifa_por_cabeza=datos.get("tarifa_por_cabeza", actual.tarifa_por_cabeza),
            estado=datos.get("estado", actual.estado),
        )
        self.repo.actualizar(nuevo)
        return self.obtener(actor, id_contrato)

    def eliminar(self, actor: Actor, id_contrato: int) -> None:
        """Elimina un contrato sin ganado. Solo el propietario del lote."""
        self._detalle_del_propietario(actor, id_contrato)
        self.repo.eliminar(id_contrato)

    def generar_documento(self, actor: Actor, id_contrato: int) -> dict:
        """Genera el texto del contrato y una huella SHA-256 que lo identifica."""
        detalle = self.detalle_visible(actor, id_contrato)
        c: Contrato = detalle["contrato"]
        cabezas = detalle["total_cabezas"]
        if cabezas == 0:
            raise ConflictoError(
                "Registre el ganado del contrato antes de generar el documento"
            )
        texto = "\n".join(
            [
                f"CONTRATO DE ARRENDAMIENTO GANADERO No. {c.id_contrato:04d}",
                "",
                f"PROPIETARIO: {detalle['nombre_propietario']} "
                f"(C.C. {detalle['cedula_propietario']})",
                f"ARRENDATARIO: {detalle['nombre_arrendatario']} "
                f"(C.C. {detalle['cedula_arrendatario']})",
                "",
                f"PRIMERA. OBJETO: arrendamiento del lote «{detalle['nombre_lote']}» "
                f"({detalle['hectareas']} ha, pasto {detalle['tipo_pastura']}) "
                f"para el pastoreo de {cabezas} cabeza(s) de ganado bovino.",
                f"SEGUNDA. DURACIÓN: {c.meses_duracion} mes(es), desde "
                f"{c.fecha_inicio.isoformat()} hasta {c.fecha_fin.isoformat()}.",
                f"TERCERA. VALOR: ${_moneda(c.tarifa_por_cabeza)} por cabeza al mes; "
                f"${_moneda(c.valor_mensual(cabezas))} mensuales y "
                f"${_moneda(c.valor_total(cabezas))} en total.",
                f"CUARTA. CAPACIDAD: el lote admite {detalle['capacidad_carga']} "
                "cabezas. El arrendatario no superará esa carga sin autorización "
                "escrita del propietario.",
                "QUINTA. CONSERVACIÓN: el arrendatario cuidará el forraje, las "
                "cercas y las fuentes de agua del lote.",
            ]
        )
        huella = hashlib.sha256(texto.encode("utf-8")).hexdigest()
        return {"id_contrato": c.id_contrato, "texto": texto, "huella_sha256": huella}

    def _detalle_del_propietario(self, actor: Actor, id_contrato: int) -> dict:
        exigir_roles(actor, PROPIETARIO)
        detalle = self.detalle_visible(actor, id_contrato)
        if not actor.es_consola and detalle["id_propietario"] != actor.id_usuario:
            raise AccesoDenegadoError("El lote del contrato es de otro propietario")
        return detalle
