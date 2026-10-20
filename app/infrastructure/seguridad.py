"""Hash de contrasenas (bcrypt) y firma de tokens (JWT)."""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app import config
from app.domain.errores import CredencialesError


def generar_hash(contrasena: str) -> str:
    """Devuelve el hash bcrypt de una contrasena. Nunca se guarda en texto plano."""
    sal = bcrypt.gensalt(rounds=config.BCRYPT_RONDAS)
    return bcrypt.hashpw(contrasena.encode("utf-8"), sal).decode("utf-8")


def verificar_contrasena(contrasena: str, hash_guardado: str) -> bool:
    """Compara una contrasena con su hash bcrypt."""
    try:
        return bcrypt.checkpw(contrasena.encode("utf-8"), hash_guardado.encode("utf-8"))
    except ValueError:
        # Hash con formato invalido (por ejemplo, cadenas de ejemplo de la Guia 6).
        return False


def crear_token(id_usuario: int, rol: str, nombre: str) -> str:
    """Crea un JWT firmado con el id, el rol y el nombre del usuario."""
    ahora = datetime.now(timezone.utc)
    carga = {
        "sub": str(id_usuario),
        "rol": rol,
        "nombre": nombre,
        "iat": ahora,
        "exp": ahora + timedelta(minutes=config.JWT_MINUTOS_VIGENCIA),
    }
    return jwt.encode(carga, config.JWT_CLAVE, algorithm=config.JWT_ALGORITMO)


def leer_token(token: str) -> dict:
    """Valida la firma y la vigencia de un JWT y devuelve su contenido."""
    try:
        return jwt.decode(token, config.JWT_CLAVE, algorithms=[config.JWT_ALGORITMO])
    except jwt.ExpiredSignatureError:
        raise CredencialesError("La sesión expiró, inicie sesión de nuevo")
    except jwt.InvalidTokenError:
        raise CredencialesError("Token inválido")
