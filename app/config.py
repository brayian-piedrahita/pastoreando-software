"""Configuracion central de Pastoreando.

Los valores se leen de variables de entorno o del archivo .env (que no se
versiona). Si no existen, se usan valores de desarrollo.
"""

import os
from pathlib import Path

RUTA_BASE = Path(__file__).resolve().parent.parent


def _cargar_archivo_env() -> None:
    """Carga las lineas CLAVE=VALOR del archivo .env, si existe.

    No pisa las variables que ya estan definidas en el sistema.
    """
    ruta_env = RUTA_BASE / ".env"
    if not ruta_env.is_file():
        return
    for linea in ruta_env.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        clave, valor = linea.split("=", 1)
        os.environ.setdefault(clave.strip(), valor.strip())


_cargar_archivo_env()

# Motor de base de datos: "sqlite" (desarrollo y pruebas) o "mysql" (servidor).
MOTOR_BD = os.environ.get("PASTOREANDO_MOTOR", "sqlite").strip().lower()
if MOTOR_BD not in ("sqlite", "mysql"):
    raise ValueError("PASTOREANDO_MOTOR debe ser 'sqlite' o 'mysql'")

# Base de datos SQLite de desarrollo (los .db estan en .gitignore).
RUTA_BD = os.environ.get("PASTOREANDO_BD", str(RUTA_BASE / "data" / "pastoreando.db"))

# Conexion a MySQL/MariaDB. La clave nunca se escribe en el codigo: viene del
# archivo .env o de las variables del servidor donde se despliega.
MYSQL_HOST = os.environ.get("PASTOREANDO_MYSQL_HOST", "127.0.0.1")
MYSQL_PUERTO = int(os.environ.get("PASTOREANDO_MYSQL_PUERTO", "3306"))
MYSQL_USUARIO = os.environ.get("PASTOREANDO_MYSQL_USUARIO", "pastoreando")
MYSQL_CLAVE = os.environ.get("PASTOREANDO_MYSQL_CLAVE", "")
MYSQL_BASE = os.environ.get("PASTOREANDO_MYSQL_BASE", "pastoreando")
# Certificado de la autoridad del servidor (ruta o texto PEM) para conexiones TLS.
MYSQL_CA = os.environ.get("PASTOREANDO_MYSQL_CA", "")
MYSQL_CA_PEM = os.environ.get("PASTOREANDO_MYSQL_CA_PEM", "")

# Autenticacion con JWT. En produccion la clave debe venir del .env.
JWT_CLAVE = os.environ.get(
    "PASTOREANDO_JWT_CLAVE", "clave-de-desarrollo-cambiar-en-produccion"
)
JWT_ALGORITMO = "HS256"
JWT_MINUTOS_VIGENCIA = int(os.environ.get("PASTOREANDO_JWT_MINUTOS", "60"))

# Costo de calculo del hash bcrypt: 12 es seguro; las pruebas usan un valor bajo.
BCRYPT_RONDAS = int(os.environ.get("PASTOREANDO_BCRYPT_RONDAS", "12"))

# Margen de utilidad proyectado (RF06 y calculo del RF01).
MARGEN_UTILIDAD = 0.20

# Codigo que deben presentar los profesionales adjuntos (Tecnico y Contador) al
# registrarse. Evita que cualquier persona se auto-asigne un rol con acceso
# amplio; en produccion se define en el .env.
CODIGO_PROFESIONAL = os.environ.get(
    "PASTOREANDO_CODIGO_PROFESIONAL", "Profesional2026*"
)

# Contrasena de los usuarios de prueba que se cargan en una base vacia.
CLAVE_USUARIOS_PRUEBA = "Pastoreando2026*"
