"""Menu de consola de Pastoreando (version standalone, sin servidor web).

Usa los mismos servicios que la API, asi que aplica las mismas validaciones.
Ejecutar con:  python -m app.cli.menu
"""

from app.domain.errores import ErrorPastoreando
from app.domain.usuario import ACTOR_CONSOLA
from app.infrastructure.datos_prueba import cargar_datos_prueba
from app.infrastructure.db import iniciar_bd
from app.services.costo_servicio import CostoServicio
from app.services.lote_servicio import LoteServicio

OPCIONES = """
=== PASTOREANDO - Consola ===
1. Listar lotes y estado de carga
2. Registrar lote
3. Modificar lote
4. Eliminar lote
5. Calcular costo por cabeza
0. Salir
"""


def pesos(valor: float) -> str:
    """Formatea pesos colombianos con punto de miles: $1.234.567."""
    return "$" + f"{valor:,.0f}".replace(",", ".")


def pedir_numero(mensaje: str) -> float | str:
    """Lee un numero; si no lo es, devuelve el texto para que el dominio lo rechace."""
    texto = input(mensaje).strip().replace(",", ".")
    try:
        return float(texto)
    except ValueError:
        return texto


def listar_lotes() -> None:
    """Imprime cada lote con su porcentaje y nivel de alerta."""
    lotes = LoteServicio().listar()
    if not lotes:
        print("No hay lotes registrados.")
    for lote in lotes:
        estado = lote["estado_carga"]
        print(
            f"[{lote['id_lote']}] {lote['nombre_lote']} | {lote['hectareas']} ha | "
            f"{estado['carga_actual']}/{lote['capacidad_carga']} cabezas "
            f"({estado['porcentaje']} %) -> {estado['nivel']}"
        )


def registrar_lote() -> None:
    """Pide los datos de un lote nuevo y lo guarda."""
    datos = {
        "id_propietario": pedir_numero("Id del propietario: "),
        "nombre_lote": input("Nombre del lote: "),
        "hectareas": pedir_numero("Hectáreas: "),
        "capacidad_carga": pedir_numero("Capacidad de carga (cabezas): "),
        "tipo_pastura": input("Tipo de pastura: "),
    }
    lote = LoteServicio().crear(ACTOR_CONSOLA, datos)
    print(f"Lote registrado con id {lote['id_lote']}.")


def modificar_lote() -> None:
    """Cambia hectareas y capacidad de un lote existente."""
    id_lote = int(pedir_numero("Id del lote: "))
    datos = {
        "hectareas": pedir_numero("Nuevas hectáreas: "),
        "capacidad_carga": pedir_numero("Nueva capacidad de carga: "),
    }
    LoteServicio().actualizar(ACTOR_CONSOLA, id_lote, datos)
    print("Lote actualizado.")


def eliminar_lote() -> None:
    """Elimina un lote por su id."""
    id_lote = int(pedir_numero("Id del lote a eliminar: "))
    LoteServicio().eliminar(ACTOR_CONSOLA, id_lote)
    print("Lote eliminado.")


def calcular_costo() -> None:
    """Pide los rubros y muestra el costo por cabeza con su desglose."""
    datos = {
        "alimentacion": pedir_numero("Alimentación del lote ($): "),
        "mantenimiento": pedir_numero("Mantenimiento del lote ($): "),
        "servicios": pedir_numero("Servicios del lote ($): "),
        "impuestos": pedir_numero("Impuestos del lote ($): "),
        "cantidad_animales": pedir_numero("Cantidad de animales: "),
        "proposito": input("Propósito (Carne / Leche / Doble Proposito): ").strip(),
    }
    r = CostoServicio().calcular(ACTOR_CONSOLA, datos)
    print(f"Subtotal del lote:   {pesos(r['subtotal_lote'])}")
    print(f"Costo base/cabeza:   {pesos(r['costo_base_por_cabeza'])}")
    print(f"Ajuste de manejo:    {pesos(r['ajuste_manejo'])}")
    print(f"Margen {r['margen_porcentaje']} %:        {pesos(r['margen_por_cabeza'])}")
    print(f"COSTO POR CABEZA:    {pesos(r['costo_unitario_final'])}")
    for fila in r["desglose"]:
        print(f"  - {fila['rubro']}: {fila['porcentaje']} %")


ACCIONES = {
    "1": listar_lotes,
    "2": registrar_lote,
    "3": modificar_lote,
    "4": eliminar_lote,
    "5": calcular_costo,
}


def main() -> None:
    """Bucle principal del menu."""
    iniciar_bd()
    cargar_datos_prueba()
    while True:
        print(OPCIONES)
        opcion = input("Elija una opción: ").strip()
        if opcion == "0":
            print("Hasta pronto.")
            return
        accion = ACCIONES.get(opcion)
        if accion is None:
            print("Opción no válida.")
            continue
        try:
            accion()
        except ErrorPastoreando as error:
            campo = f" ({error.campo})" if error.campo else ""
            print(f"Error{campo}: {error.mensaje}")
        except ValueError:
            print("Error: el id debe ser un número entero.")


if __name__ == "__main__":
    main()
