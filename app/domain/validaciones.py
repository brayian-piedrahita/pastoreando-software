"""Funciones de validacion reutilizables por las entidades del dominio.

Las reglas se validan aqui, en el dominio, y no en la API ni en la base de
datos: asi aplican igual para la web, la consola y las pruebas.
"""

import re
from datetime import date

from app.domain.errores import ValidacionError

# Letras (con tildes y enie), numeros, espacio y los signos . , ' -
PATRON_NOMBRE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,'\-]+$")
# Solo letras, espacio, punto y guion (para razas y nombres de persona)
PATRON_LETRAS = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'\-]+$")
PATRON_CORREO = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")
PATRON_FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}$")

FECHA_MINIMA = date(2000, 1, 1)
FECHA_MAXIMA = date(2100, 12, 31)


def validar_texto(
    valor: object,
    campo: str,
    minimo: int,
    maximo: int,
    patron: re.Pattern = PATRON_NOMBRE,
) -> str:
    """Valida longitud y caracteres de un texto y lo devuelve sin espacios sobrantes."""
    if not isinstance(valor, str):
        raise ValidacionError("Debe ser un texto", campo)
    texto = " ".join(valor.split())  # quita espacios repetidos y extremos
    if len(texto) < minimo:
        if minimo == 1:
            raise ValidacionError("Es obligatorio", campo)
        raise ValidacionError(f"Debe tener al menos {minimo} caracteres", campo)
    if len(texto) > maximo:
        raise ValidacionError(f"No puede superar {maximo} caracteres", campo)
    if not patron.match(texto):
        raise ValidacionError("Contiene caracteres no permitidos", campo)
    return texto


def validar_numero(
    valor: object,
    campo: str,
    minimo: float,
    maximo: float,
    incluir_minimo: bool = True,
) -> float:
    """Valida que sea un numero dentro de un rango."""
    if isinstance(valor, bool) or not isinstance(valor, (int, float)):
        raise ValidacionError("Debe ser un número", campo)
    numero = float(valor)
    if numero != numero or numero in (float("inf"), float("-inf")):
        raise ValidacionError("Debe ser un número válido", campo)
    if incluir_minimo and numero < minimo:
        raise ValidacionError(f"Debe ser mayor o igual a {minimo:g}", campo)
    if not incluir_minimo and numero <= minimo:
        raise ValidacionError(f"Debe ser mayor a {minimo:g}", campo)
    if numero > maximo:
        raise ValidacionError(f"No puede superar {maximo:,.0f}", campo)
    return numero


def validar_entero(valor: object, campo: str, minimo: int, maximo: int) -> int:
    """Valida que sea un entero dentro de un rango."""
    if isinstance(valor, bool) or not isinstance(valor, int):
        if isinstance(valor, float) and valor.is_integer():
            valor = int(valor)
        else:
            raise ValidacionError("Debe ser un número entero", campo)
    if valor < minimo:
        raise ValidacionError(f"Debe ser mayor o igual a {minimo}", campo)
    if valor > maximo:
        raise ValidacionError(f"No puede superar {maximo}", campo)
    return int(valor)


def validar_fecha(valor: object, campo: str) -> date:
    """Valida una fecha real en formato AAAA-MM-DD dentro de un rango razonable."""
    if not isinstance(valor, str) or not PATRON_FECHA.match(valor.strip()):
        raise ValidacionError("Use el formato AAAA-MM-DD", campo)
    try:
        fecha = date.fromisoformat(valor.strip())
    except ValueError:
        raise ValidacionError("La fecha no existe en el calendario", campo)
    if fecha < FECHA_MINIMA or fecha > FECHA_MAXIMA:
        raise ValidacionError("La fecha debe estar entre 2000 y 2100", campo)
    return fecha


def validar_opcion(valor: object, campo: str, opciones: tuple[str, ...]) -> str:
    """Valida que el valor sea una de las opciones permitidas."""
    if valor not in opciones:
        raise ValidacionError(f"Debe ser uno de: {', '.join(opciones)}", campo)
    return str(valor)


def validar_correo(valor: object, campo: str = "correo") -> str:
    """Valida el formato basico de un correo electronico."""
    texto = validar_texto(valor, campo, 5, 100, re.compile(r"^\S+$"))
    if not PATRON_CORREO.match(texto):
        raise ValidacionError("No es un correo válido", campo)
    return texto.lower()


# Cedula colombiana: solo digitos, entre 6 y 12.
PATRON_CEDULA = re.compile(r"^\d{6,12}$")
# bcrypt solo procesa los primeros 72 bytes; mas largo se rechaza de entrada.
MAXIMO_BYTES_CONTRASENA = 72


def validar_cedula(valor: object, campo: str = "cedula") -> str:
    """Valida que la cedula sean entre 6 y 12 digitos."""
    texto = validar_texto(valor, campo, 6, 12, re.compile(r"^\S+$"))
    if not PATRON_CEDULA.match(texto):
        raise ValidacionError("Debe tener entre 6 y 12 dígitos", campo)
    return texto


def validar_contrasena_nueva(valor: object, campo: str = "contrasena") -> str:
    """Valida la contrasena de un registro: 8+ caracteres, letras y numeros.

    No se recorta ni se normaliza: se guarda exactamente lo que el usuario escribe.
    """
    if not isinstance(valor, str):
        raise ValidacionError("Debe ser un texto", campo)
    if len(valor) < 8:
        raise ValidacionError("Debe tener al menos 8 caracteres", campo)
    if len(valor.encode("utf-8")) > MAXIMO_BYTES_CONTRASENA:
        raise ValidacionError("No puede superar 72 caracteres", campo)
    if not re.search(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]", valor) or not re.search(r"\d", valor):
        raise ValidacionError("Debe combinar letras y números", campo)
    return valor
