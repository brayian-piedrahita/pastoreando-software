"""Entidad Recomendacion: indicacion tecnica sobre un hato de ganado."""

import re
from dataclasses import dataclass
from datetime import date

from app.domain.validaciones import validar_entero, validar_texto

# Letras, numeros, espacio y signos de puntuacion habituales; sin < > / ni comillas
# dobles, para que el texto no pueda llevar etiquetas ni codigo.
PATRON_DESCRIPCION = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,;:'()%¿?¡!\-]+$")


@dataclass
class Recomendacion:
    """Recomendacion de un zootecnista (tecnico) sobre un hato."""

    id_ganado: int
    id_zootecnista: int
    descripcion: str
    fecha: date | None = None
    id_recomendacion: int | None = None

    def __post_init__(self) -> None:
        """Valida el texto y asigna la fecha de hoy si no viene una."""
        self.id_ganado = validar_entero(self.id_ganado, "id_ganado", 1, 1_000_000_000)
        self.id_zootecnista = validar_entero(
            self.id_zootecnista, "id_zootecnista", 1, 1_000_000_000
        )
        self.descripcion = validar_texto(
            self.descripcion, "descripcion", 10, 500, PATRON_DESCRIPCION
        )
        if self.fecha is None:
            self.fecha = date.today()
