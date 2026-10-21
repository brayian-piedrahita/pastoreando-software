"""Pruebas del servicio de registro y de los mensajes de inicio de sesion (AA5-EV01)."""

import pytest

from app import config
from tests.conftest import CLAVE, PROPIETARIO


@pytest.fixture()
def datos_registro() -> dict:
    """Datos correctos para registrar un arrendatario nuevo."""
    return {
        "nombre": "Ana",
        "apellidos": "Londoño Ruiz",
        "cedula": "1112223334",
        "rol": "Arrendatario",
        "correo": "ana.londono@pastoreando.co",
        "contrasena": "ClaveSegura2026",
    }


def test_registro_correcto(cliente, datos_registro):
    """CP-R01 | CU-REG | Registro con datos validos | 201 y usuario sin contraseña"""
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 201
    cuerpo = r.json()
    assert cuerpo["mensaje"] == "Usuario registrado correctamente"
    assert cuerpo["usuario"]["correo"] == "ana.londono@pastoreando.co"
    assert cuerpo["usuario"]["rol"] == "Arrendatario"
    assert "contrasena" not in cuerpo["usuario"]


def test_registro_y_login_con_la_cuenta_nueva(cliente, datos_registro):
    """CP-R02 | CU-REG | Registrarse e iniciar sesion | login 200 con el mensaje del caso"""
    cliente.post("/api/auth/registro", json=datos_registro)
    r = cliente.post(
        "/api/auth/login",
        json={"correo": datos_registro["correo"], "contrasena": "ClaveSegura2026"},
    )
    assert r.status_code == 200
    assert r.json()["mensaje"] == "Autenticación satisfactoria"
    assert r.json()["usuario"]["nombre"] == "Ana"


def test_registro_correo_repetido(cliente, datos_registro):
    """CP-R03 | CU-REG | Correo ya registrado | 409"""
    datos_registro["correo"] = PROPIETARIO
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 409


def test_registro_cedula_repetida(cliente, datos_registro):
    """CP-R04 | CU-REG | Cedula ya registrada | 409"""
    datos_registro["cedula"] = "10456789"
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 409


@pytest.mark.parametrize(
    "campo,valor",
    [
        ("nombre", ""),
        ("nombre", "A"),
        ("nombre", "<b>Ana</b>"),
        ("apellidos", "Ruiz123"),
        ("cedula", "12345"),
        ("cedula", "12ab5678"),
        ("cedula", "1234567890123"),
        ("correo", "sin-arroba"),
        ("rol", "Administrador"),
        ("contrasena", "corta1"),
        ("contrasena", "soloLetrasSinNumeros"),
        ("contrasena", "123456789012"),
        ("contrasena", "a1" * 40),
    ],
)
def test_registro_datos_invalidos(cliente, datos_registro, campo, valor):
    """CP-R05 | CU-REG | Datos fuera de regla (texto, cedula, correo, rol, clave) | 422 en el campo"""
    datos_registro[campo] = valor
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 422
    assert r.json()["campo"] == campo


def test_registro_campo_faltante(cliente, datos_registro):
    """CP-R06 | CU-REG | Cuerpo sin el correo | 422"""
    del datos_registro["correo"]
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 422


def test_registro_campo_desconocido(cliente, datos_registro):
    """CP-R07 | CU-REG | Campo que no existe en el servicio | 422"""
    datos_registro["es_admin"] = True
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 422


def test_registro_profesional_sin_codigo(cliente, datos_registro):
    """CP-R08 | CU-REG | Contador sin codigo de profesional | 403"""
    datos_registro["rol"] = "Contador"
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 403
    assert r.json()["campo"] == "codigo_profesional"


def test_registro_profesional_codigo_incorrecto(cliente, datos_registro):
    """CP-R09 | CU-REG | Tecnico con codigo equivocado | 403"""
    datos_registro["rol"] = "Tecnico"
    datos_registro["codigo_profesional"] = "codigo-falso"
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 403


def test_registro_profesional_codigo_correcto(cliente, datos_registro):
    """CP-R10 | CU-REG | Tecnico con el codigo correcto | 201 y rol Tecnico"""
    datos_registro["rol"] = "Tecnico"
    datos_registro["codigo_profesional"] = config.CODIGO_PROFESIONAL
    r = cliente.post("/api/auth/registro", json=datos_registro)
    assert r.status_code == 201
    assert r.json()["usuario"]["rol"] == "Tecnico"


def test_registro_guarda_hash_no_texto_plano(cliente, datos_registro):
    """CP-R11 | CU-REG | Contraseña guardada | solo el hash bcrypt, nunca el texto"""
    from app.infrastructure.repositorio_usuarios import RepositorioUsuarios

    cliente.post("/api/auth/registro", json=datos_registro)
    guardado = RepositorioUsuarios().buscar_credenciales(datos_registro["correo"])
    assert guardado["contrasena"] != "ClaveSegura2026"
    assert guardado["contrasena"].startswith("$2")


def test_login_error_con_mensaje_del_caso(cliente):
    """CP-R12 | CU-ACC | Login incorrecto | 401 con "Error en la autenticación" """
    r = cliente.post(
        "/api/auth/login", json={"correo": PROPIETARIO, "contrasena": "equivocada1"}
    )
    assert r.status_code == 401
    assert r.json()["mensaje"] == "Error en la autenticación"
    assert r.json()["detalle"] == "Correo o contraseña incorrectos"


def test_login_correcto_con_mensaje_del_caso(cliente):
    """CP-R13 | CU-ACC | Login correcto | 200 con "Autenticación satisfactoria" """
    r = cliente.post(
        "/api/auth/login", json={"correo": PROPIETARIO, "contrasena": CLAVE}
    )
    assert r.status_code == 200
    assert r.json()["mensaje"] == "Autenticación satisfactoria"
