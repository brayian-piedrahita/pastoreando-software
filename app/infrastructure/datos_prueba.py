"""Datos de prueba de la Guia 6 (EV04) para una base de datos vacia.

Los usuarios, lotes, contratos y ganado son los mismos del script SQL ya
entregado. Todos los usuarios comparten la contrasena de prueba definida en
config.CLAVE_USUARIOS_PRUEBA; en la base solo se guarda su hash bcrypt.
"""

from app import config
from app.infrastructure.db import obtener_bd
from app.infrastructure.seguridad import generar_hash

USUARIOS = [
    (
        "Carlos",
        "Ramirez Soto",
        "10456789",
        "Propietario",
        "carlos.ramirez@pastoreando.co",
    ),
    (
        "Brayian",
        "Piedrahita Cortes",
        "1088765432",
        "Arrendatario",
        "brayian.piedrahita@pastoreando.co",
    ),
    ("Laura", "Gomez Duque", "42987654", "Tecnico", "laura.gomez@pastoreando.co"),
    (
        "Marta Lucia",
        "Restrepo Ocampo",
        "24325678",
        "Propietario",
        "marta.restrepo@pastoreando.co",
    ),
    (
        "Jhon Fredy",
        "Osorio Marin",
        "10567812",
        "Arrendatario",
        "jhon.osorio@pastoreando.co",
    ),
    (
        "Andres Felipe",
        "Cardona Rios",
        "1089654321",
        "Arrendatario",
        "andres.cardona@pastoreando.co",
    ),
    (
        "Sandra Milena",
        "Bedoya Arango",
        "42055123",
        "Contador",
        "sandra.bedoya@pastoreando.co",
    ),
    (
        "Camilo Andres",
        "Zuluaga Vargas",
        "1093456789",
        "Tecnico",
        "camilo.zuluaga@pastoreando.co",
    ),
]

LOTES = [
    (1, "Potrero La Esperanza", 12.50, 30, "Brachiaria"),
    (1, "Lote Alto El Mirador", 8.00, 20, "Kikuyo"),
    (4, "Potrero Las Acacias", 20.00, 50, "Pasto Estrella"),
    (4, "Lote Rio Frio", 5.50, 12, "Kikuyo"),
]

CONTRATOS = [
    (2, 1, "2026-10-01", 6, 85000.00, "Activo"),
    (5, 2, "2026-09-15", 4, 90000.00, "Activo"),
    (6, 3, "2026-08-01", 8, 70000.00, "Activo"),
    (5, 4, "2026-06-01", 3, 95000.00, "Finalizado"),
    (2, 3, "2026-10-10", 6, 70000.00, "Activo"),
]

GANADO = [
    (1, "Brahman", 8, "Carne"),
    (1, "Gyr", 5, "Leche"),
    (1, "Angus", 6, "Carne"),
    (1, "Holstein", 4, "Leche"),
    (1, "Girolando", 3, "Doble Proposito"),
    (2, "Brahman", 14, "Carne"),
    (2, "Normando", 10, "Doble Proposito"),
    (3, "Angus", 18, "Carne"),
    (3, "Brahman", 12, "Carne"),
    (3, "Holstein", 10, "Leche"),
    (4, "Gyr", 6, "Leche"),
    (5, "Simmental", 8, "Doble Proposito"),
]


def cargar_datos_prueba() -> bool:
    """Inserta los datos de prueba solo si no hay usuarios. Devuelve si cargo."""
    with obtener_bd().conexion() as con:
        if con.execute("SELECT COUNT(*) FROM USUARIOS").fetchone()[0] > 0:
            return False
        # Un solo hash para todos: calcularlo ocho veces seria lento sin necesidad.
        hash_comun = generar_hash(config.CLAVE_USUARIOS_PRUEBA)
        con.executemany(
            "INSERT INTO USUARIOS (nombre, apellidos, cedula, rolUsuario, correo, "
            "contrasena) VALUES (?, ?, ?, ?, ?, ?)",
            [(*u, hash_comun) for u in USUARIOS],
        )
        con.executemany(
            "INSERT INTO LOTES (idPropietario, nombreLote, hectareas, "
            "capacidadCarga, tipoPastura) VALUES (?, ?, ?, ?, ?)",
            LOTES,
        )
        con.executemany(
            "INSERT INTO CONTRATOS (idArrendatario, idLote, fechaInicio, "
            "mesesDuracion, tarifaPorCabeza, estado) VALUES (?, ?, ?, ?, ?, ?)",
            CONTRATOS,
        )
        con.executemany(
            "INSERT INTO GANADO (idContrato, raza, cantidadCabezas, proposito) "
            "VALUES (?, ?, ?, ?)",
            GANADO,
        )
    return True
