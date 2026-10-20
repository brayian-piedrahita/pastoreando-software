"""Entidad Lote y regla de alerta por sobrecarga animal (RF04)."""

from dataclasses import dataclass, field

from app.domain.validaciones import validar_entero, validar_numero, validar_texto

# Porcentaje de ocupacion desde el cual el lote se considera casi lleno.
UMBRAL_ALERTA = 80.0

NIVEL_NORMAL = "NORMAL"
NIVEL_ALERTA = "ALERTA"
NIVEL_SOBRECARGA = "SOBRECARGA"


@dataclass
class EstadoCarga:
    """Resultado de comparar la carga actual de un lote con su capacidad."""

    carga_actual: int
    capacidad_carga: int
    porcentaje: float
    nivel: str
    mensaje: str
    excedente: int
    sugerencias: list[str] = field(default_factory=list)

    def a_dict(self) -> dict:
        """Representacion lista para responder en JSON."""
        return {
            "carga_actual": self.carga_actual,
            "capacidad_carga": self.capacidad_carga,
            "porcentaje": self.porcentaje,
            "nivel": self.nivel,
            "mensaje": self.mensaje,
            "excedente": self.excedente,
            "sugerencias": self.sugerencias,
        }


@dataclass
class Lote:
    """Lote de pastoreo con su capacidad de carga en cabezas de ganado."""

    id_propietario: int
    nombre_lote: str
    hectareas: float
    capacidad_carga: int
    tipo_pastura: str
    id_lote: int | None = None

    def __post_init__(self) -> None:
        """Valida los datos al crear o modificar el lote."""
        self.id_propietario = validar_entero(
            self.id_propietario, "id_propietario", 1, 1_000_000_000
        )
        self.nombre_lote = validar_texto(self.nombre_lote, "nombre_lote", 3, 50)
        # El CHECK de la BD exige hectareas > 0; aqui se rechaza antes de llegar.
        self.hectareas = round(
            validar_numero(
                self.hectareas, "hectareas", 0, 10_000, incluir_minimo=False
            ),
            2,
        )
        self.capacidad_carga = validar_entero(
            self.capacidad_carga, "capacidad_carga", 1, 5_000
        )
        self.tipo_pastura = validar_texto(self.tipo_pastura, "tipo_pastura", 3, 50)

    def porcentaje_ocupacion(self, cabezas: int) -> float:
        """Devuelve el porcentaje de ocupacion con un decimal."""
        return round(cabezas / self.capacidad_carga * 100, 1)

    def esta_sobrecargado(self, cabezas: int) -> bool:
        """True si las cabezas superan la capacidad de carga."""
        return cabezas > self.capacidad_carga

    def nivel_alerta(self, cabezas: int) -> str:
        """Clasifica la carga en NORMAL, ALERTA o SOBRECARGA."""
        if self.esta_sobrecargado(cabezas):
            return NIVEL_SOBRECARGA
        if self.porcentaje_ocupacion(cabezas) > UMBRAL_ALERTA:
            return NIVEL_ALERTA
        return NIVEL_NORMAL

    def evaluar_carga(self, cabezas: int) -> EstadoCarga:
        """Compara la carga actual con la capacidad y arma la alerta (RF04)."""
        nivel = self.nivel_alerta(cabezas)
        excedente = max(cabezas - self.capacidad_carga, 0)
        if nivel == NIVEL_SOBRECARGA:
            mensaje = (
                f"¡Sobrecarga! El lote supera su capacidad en {excedente} "
                f"cabeza(s)."
            )
            sugerencias = [
                f"Reubicar al menos {excedente} cabeza(s) en otro lote.",
                "Dividir el potrero en franjas y rotar el ganado cada 12 días.",
                "Suplementar la alimentación mientras se reduce la carga.",
            ]
        elif nivel == NIVEL_ALERTA:
            mensaje = "El lote está próximo a exceder su capacidad de carga."
            sugerencias = [
                "Evitar nuevos ingresos de animales al lote.",
                "Revisar el estado del forraje antes de la próxima rotación.",
            ]
        else:
            mensaje = "La carga animal está dentro de la capacidad del lote."
            sugerencias = []
        return EstadoCarga(
            carga_actual=cabezas,
            capacidad_carga=self.capacidad_carga,
            porcentaje=self.porcentaje_ocupacion(cabezas),
            nivel=nivel,
            mensaje=mensaje,
            excedente=excedente,
            sugerencias=sugerencias,
        )
