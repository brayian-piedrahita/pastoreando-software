"""Entidad Ganado: hato de una misma raza dentro de un contrato."""

from dataclasses import dataclass

from app.domain.validaciones import (
    PATRON_LETRAS,
    validar_entero,
    validar_opcion,
    validar_texto,
)

# Mismos valores que el ENUM proposito de la tabla GANADO (Guia 6).
PROPOSITOS = ("Carne", "Leche", "Doble Proposito")


@dataclass
class Ganado:
    """Hato de una raza con su cantidad de cabezas y su proposito."""

    id_contrato: int
    raza: str
    cantidad_cabezas: int
    proposito: str
    id_ganado: int | None = None

    def __post_init__(self) -> None:
        """Valida los datos al crear o modificar el hato."""
        self.id_contrato = validar_entero(
            self.id_contrato, "id_contrato", 1, 1_000_000_000
        )
        self.raza = validar_texto(self.raza, "raza", 2, 40, PATRON_LETRAS)
        self.cantidad_cabezas = validar_entero(
            self.cantidad_cabezas, "cantidad_cabezas", 1, 1_000
        )
        self.proposito = validar_opcion(self.proposito, "proposito", PROPOSITOS)
