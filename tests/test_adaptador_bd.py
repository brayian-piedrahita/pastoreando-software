"""Pruebas del adaptador de base de datos (funciona con SQLite y con MySQL).

Las pruebas de traduccion y conversion no necesitan servidor. Las que usan el
fixture cliente corren sobre el motor activo (PASTOREANDO_MOTOR).
"""

import sqlite3

import pymysql
import pytest

from app import config
from app.infrastructure.conexion_mysql import (
    FilaMySQL,
    _fecha_hora,
    _numero,
    _sentencias,
    crear_tablas,
    traducir_marcadores,
)
from app.infrastructure.db import ErrorIntegridad, obtener_bd
from tests.conftest import _vaciar_mysql

INSERTAR_LOTE_NEGATIVO = (
    "INSERT INTO LOTES (idPropietario, nombreLote, hectareas, capacidadCarga, "
    "tipoPastura) VALUES (?, ?, ?, ?, ?)"
)


def test_marcadores_se_traducen():
    """CP-A01 | Adaptador | SQL con ? | Se cambian por %s"""
    sql = "SELECT * FROM LOTES WHERE idLote = ? AND idPropietario = ?"
    assert traducir_marcadores(sql) == (
        "SELECT * FROM LOTES WHERE idLote = %s AND idPropietario = %s"
    )


def test_marcador_entre_comillas_no_se_toca():
    """CP-A02 | Adaptador | ? dentro de un texto | Queda igual"""
    sql = "SELECT '?' AS a, \"?\" AS b FROM LOTES WHERE idLote = ?"
    assert traducir_marcadores(sql) == (
        "SELECT '?' AS a, \"?\" AS b FROM LOTES WHERE idLote = %s"
    )


def test_porcentaje_se_duplica():
    """CP-A03 | Adaptador | % en el SQL | Se duplica para PyMySQL"""
    sql = "SELECT * FROM LOTES WHERE nombreLote LIKE 'El%' AND idLote = ?"
    assert traducir_marcadores(sql) == (
        "SELECT * FROM LOTES WHERE nombreLote LIKE 'El%%' AND idLote = %s"
    )


def test_fila_se_lee_por_nombre_y_por_indice():
    """CP-A04 | Adaptador | Fila de MySQL | Acepta nombre e indice"""
    fila = FilaMySQL({"idLote": 7, "nombreLote": "El Roble"})
    assert fila["nombreLote"] == "El Roble"
    assert fila[0] == 7
    assert fila[1] == "El Roble"
    assert dict(fila) == {"idLote": 7, "nombreLote": "El Roble"}


def test_decimal_sin_parte_decimal_vuelve_entero():
    """CP-A05 | Adaptador | SUM de enteros | int, no float"""
    assert _numero("104") == 104
    assert isinstance(_numero("104"), int)
    assert _numero(b"104") == 104


def test_decimal_con_parte_decimal_vuelve_float():
    """CP-A06 | Adaptador | DECIMAL(10,2) | float"""
    assert _numero("85000.00") == 85000.0
    assert isinstance(_numero("85000.00"), float)


def test_fecha_hora_usa_la_letra_t():
    """CP-A07 | Adaptador | DATETIME | Mismo formato que escribe la aplicacion"""
    assert _fecha_hora("2026-10-23 21:05:00") == "2026-10-23T21:05:00"
    assert _fecha_hora(b"2026-10-23 21:05:00") == "2026-10-23T21:05:00"


def test_script_se_separa_sin_comentarios():
    """CP-A08 | Adaptador | Script con ; en un comentario | No parte la sentencia"""
    script = (
        "-- primera; con punto y coma\nCREATE TABLE A (x INT);\nCREATE TABLE B (y INT);"
    )
    assert _sentencias(script) == ["CREATE TABLE A (x INT)", "CREATE TABLE B (y INT)"]


def test_error_de_integridad_cubre_los_dos_motores():
    """CP-A09 | Adaptador | ErrorIntegridad | Incluye SQLite y MySQL"""
    assert sqlite3.IntegrityError in ErrorIntegridad
    assert pymysql.IntegrityError in ErrorIntegridad


def test_motor_activo_es_valido():
    """CP-A10 | Adaptador | Motor en uso | sqlite o mysql"""
    assert obtener_bd().motor in ("sqlite", "mysql")


def test_check_violado_es_error_de_integridad(cliente):
    """CP-A11 | Adaptador | Lote con hectareas negativas | ErrorIntegridad"""
    with pytest.raises(ErrorIntegridad):
        with obtener_bd().conexion() as con:
            con.execute(INSERTAR_LOTE_NEGATIVO, (1, "Prueba", -1, 5, "Pasto"))


def test_llave_foranea_inexistente_es_error_de_integridad(cliente):
    """CP-A12 | Adaptador | Lote de un propietario que no existe | ErrorIntegridad"""
    with pytest.raises(ErrorIntegridad):
        with obtener_bd().conexion() as con:
            con.execute(INSERTAR_LOTE_NEGATIVO, (9999, "Prueba", 1, 5, "Pasto"))


def test_update_sin_cambios_cuenta_la_fila_encontrada(cliente):
    """CP-A13 | Adaptador | UPDATE con el mismo valor | rowcount = 1"""
    with obtener_bd().conexion() as con:
        cursor = con.execute(
            "UPDATE LOTES SET nombreLote = nombreLote WHERE idLote = ?", (1,)
        )
        assert cursor.rowcount == 1


def test_concatenacion_con_barras_funciona(cliente):
    """CP-A14 | Adaptador | nombre || ' ' || apellidos | Texto unido"""
    with obtener_bd().conexion() as con:
        fila = con.execute(
            "SELECT nombre, apellidos, nombre || ' ' || apellidos AS completo "
            "FROM USUARIOS WHERE idUsuario = ?",
            (1,),
        ).fetchone()
    assert fila["completo"] == f"{fila['nombre']} {fila['apellidos']}"


@pytest.mark.skipif(
    obtener_bd().motor != "mysql", reason="Solo aplica cuando el motor es MySQL"
)
def test_crear_tablas_es_idempotente(cliente):
    """CP-A15 | Adaptador MySQL | Crear tablas dos veces | La segunda no crea nada"""
    with obtener_bd().conexion() as con:
        assert crear_tablas(con) == []


def test_no_se_vacia_una_base_que_no_es_de_prueba(monkeypatch):
    """CP-A16 | Salvaguarda | Base real configurada para pruebas | Se detiene sin borrar"""
    monkeypatch.setattr(config, "MYSQL_BASE", "pastoreando")
    with pytest.raises(pytest.exit.Exception):
        _vaciar_mysql()
