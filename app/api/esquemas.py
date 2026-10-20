"""Esquemas de entrada de la API.

Los campos se declaran sin tipo estricto a proposito: la validacion real (tipo,
rango, longitud, caracteres) vive en el dominio, de modo que la web, la consola
y las pruebas reciban exactamente los mismos mensajes.
"""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class EsquemaBase(BaseModel):
    """Rechaza campos desconocidos para detectar errores de nombre."""

    model_config = ConfigDict(extra="forbid")


class LoginEntrada(EsquemaBase):
    correo: Any = Field(None, examples=["carlos.ramirez@pastoreando.co"])
    contrasena: Any = Field(None, examples=["Pastoreando2026*"])


class LoteEntrada(EsquemaBase):
    nombre_lote: Any = Field(None, examples=["Potrero El Roble"])
    hectareas: Any = Field(None, examples=[10.5])
    capacidad_carga: Any = Field(None, examples=[25])
    tipo_pastura: Any = Field(None, examples=["Brachiaria"])


class ContratoEntrada(EsquemaBase):
    id_lote: Any = Field(None, examples=[1])
    id_arrendatario: Any = Field(None, examples=[2])
    fecha_inicio: Any = Field(None, examples=["2026-11-01"])
    meses_duracion: Any = Field(None, examples=[6])
    tarifa_por_cabeza: Any = Field(None, examples=[85000])
    estado: Any = Field(None, examples=["Activo"])


class GanadoEntrada(EsquemaBase):
    raza: Any = Field(None, examples=["Brahman"])
    cantidad_cabezas: Any = Field(None, examples=[10])
    proposito: Any = Field(None, examples=["Carne"])


class CostoEntrada(EsquemaBase):
    alimentacion: Any = Field(None, examples=[6000000])
    mantenimiento: Any = Field(None, examples=[3000000])
    servicios: Any = Field(None, examples=[1500000])
    impuestos: Any = Field(None, examples=[1500000])
    cantidad_animales: Any = Field(None, examples=[50])
    proposito: Any = Field(None, examples=["Carne"])
