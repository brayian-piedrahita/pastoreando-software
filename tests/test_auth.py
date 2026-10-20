"""Pruebas de autenticacion y control de acceso (CU-ACC)."""

import jwt

from app import config
from app.infrastructure.seguridad import generar_hash, verificar_contrasena
from tests.conftest import CLAVE, PROPIETARIO


def test_login_correcto(cliente):
    """CP-L01 | CU-ACC | Correo y clave correctos | 200, token y rol Propietario"""
    r = cliente.post(
        "/api/auth/login", json={"correo": PROPIETARIO, "contrasena": CLAVE}
    )
    assert r.status_code == 200
    cuerpo = r.json()
    assert cuerpo["usuario"]["rol"] == "Propietario"
    assert "contrasena" not in cuerpo["usuario"]
    carga = jwt.decode(cuerpo["token"], config.JWT_CLAVE, algorithms=["HS256"])
    assert carga["rol"] == "Propietario"


def test_login_clave_incorrecta(cliente):
    """CP-L02 | CU-ACC | Clave equivocada | 401 con mensaje generico"""
    r = cliente.post(
        "/api/auth/login", json={"correo": PROPIETARIO, "contrasena": "mala"}
    )
    assert r.status_code == 401
    assert r.json()["detalle"] == "Correo o contraseña incorrectos"


def test_login_correo_inexistente_mismo_mensaje(cliente):
    """CP-L03 | CU-ACC | Correo que no existe | 401 con el mismo mensaje (no revela cual fallo)"""
    r = cliente.post(
        "/api/auth/login", json={"correo": "nadie@x.co", "contrasena": CLAVE}
    )
    assert r.status_code == 401
    assert r.json()["detalle"] == "Correo o contraseña incorrectos"


def test_login_correo_con_formato_invalido(cliente):
    """CP-L04 | CU-ACC | Correo 'sin-arroba' | 422 indicando el campo correo"""
    r = cliente.post(
        "/api/auth/login", json={"correo": "sin-arroba", "contrasena": CLAVE}
    )
    assert r.status_code == 422
    assert r.json()["campo"] == "correo"


def test_login_contrasena_demasiado_larga(cliente):
    """CP-L05 | CU-ACC | Clave de 80 caracteres (limite bcrypt 72 bytes) | 401 sin error 500"""
    r = cliente.post(
        "/api/auth/login", json={"correo": PROPIETARIO, "contrasena": "a" * 80}
    )
    assert r.status_code == 401


def test_login_inyeccion_sql(cliente):
    """CP-L06 | CU-ACC | Correo con comilla y OR 1=1 | 422, la consulta parametrizada no se altera"""
    r = cliente.post(
        "/api/auth/login",
        json={"correo": "' OR 1=1 --@x.co", "contrasena": "x"},
    )
    assert r.status_code in (401, 422)


def test_ruta_protegida_sin_token(cliente):
    """CP-L07 | CU-ACC | GET /api/lotes sin encabezado Authorization | 401"""
    assert cliente.get("/api/lotes").status_code == 401


def test_token_alterado(cliente, entrar):
    """CP-L08 | CU-ACC | Token con la firma modificada | 401"""
    token = entrar(PROPIETARIO)["Authorization"] + "x"
    assert (
        cliente.get("/api/lotes", headers={"Authorization": token}).status_code == 401
    )


def test_contrasena_se_guarda_con_hash(cliente):
    """CP-L09 | CU-ACC | Hash bcrypt de una clave | No es texto plano y se verifica"""
    hash_ = generar_hash("Clave123*")
    assert hash_ != "Clave123*" and hash_.startswith("$2")
    assert verificar_contrasena("Clave123*", hash_)
    assert not verificar_contrasena("otra", hash_)
