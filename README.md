# Pastoreando

Sistema de gestión ganadera integral para el arrendamiento de lotes de pastoreo
de ganado bovino en Colombia. Proyecto formativo del Tecnólogo en Análisis y
Desarrollo de Software (SENA, ficha 3134556).

## Qué hace esta versión

| Módulo | Requisito / caso de uso | Descripción |
|---|---|---|
| Autenticación | CU-ACC | Inicio de sesión con contraseña cifrada (bcrypt) y token JWT con rol |
| Lotes | CU-LOT | Alta, consulta, edición y baja de lotes por su propietario |
| Alerta de carga | RF04 | Nivel NORMAL, ALERTA (más del 80 %) o SOBRECARGA (más del 100 %) con sugerencias |
| Costos | RF01 · RF02 | Costo por cabeza con desglose en alimentación, mantenimiento, servicios e impuestos, margen del 20 % y patrón Strategy por propósito |
| Contratos | RF05 | Contratos de arrendamiento con valor mensual y total calculados |
| Ganado | CU-GAN | Registro del ganado de cada contrato; recalcula la alerta del lote |
| Documento | RF05 | Texto del contrato con huella SHA-256 |
| Consola | — | Versión standalone para gestionar lotes y calcular costos sin servidor |

Los códigos RF corresponden a la especificación de requerimientos del proyecto. CU-ACC, CU-LOT y CU-GAN son casos de uso de soporte (acceso, gestión de lotes y registro de ganado) que hacen posible los requisitos.

## Arquitectura

```
app/
  domain/          Entidades y reglas (Lote, Contrato, Ganado, costo, validaciones)
  infrastructure/  SQLite o MySQL (Singleton y adaptador), repositorios con consultas parametrizadas, seguridad
  services/        Casos de uso y permisos por rol
  api/             Rutas FastAPI y traducción de errores a códigos HTTP
  cli/             Menú de consola
frontend/          PWA (HTML, CSS, JS con Materialize local) y service worker
sql/               Esquema SQLite (desarrollo) y MySQL/MariaDB (producción)
tests/             Pruebas con pytest
```

Patrones: capas (MVC), Singleton para la conexión y Strategy para el costo según
el propósito del ganado (Carne, Leche, Doble Propósito).

## Instalación

Requiere Python 3.13.

```bash
python -m venv venv
source venv/Scripts/activate        # Git Bash en Windows
python -m pip install -r requirements.txt
```

## Ejecución

Aplicación web (se crea `data/pastoreando.db` con los datos de prueba):

```bash
python -m uvicorn app.main:app --reload
```

Abrir <http://127.0.0.1:8000>. La documentación interactiva de la API queda en
<http://127.0.0.1:8000/docs>.

Versión de consola:

```bash
python -m app.cli.menu
```

### Usuarios de prueba

Todos usan la contraseña `Pastoreando2026*`.

| Rol | Correo |
|---|---|
| Propietario | carlos.ramirez@pastoreando.co |
| Arrendatario | brayian.piedrahita@pastoreando.co |
| Técnico | laura.gomez@pastoreando.co |
| Contador | sandra.bedoya@pastoreando.co |

## Pruebas y estilo

```bash
python -m pytest -v        # pruebas automáticas
python -m black --check .  # formato
python -m flake8 .         # estilo PEP 8 (máximo 88 columnas)
```

## Base de datos MySQL/MariaDB

Por defecto la aplicación usa SQLite (`data/pastoreando.db`). Para trabajar con
MySQL se elige el motor con variables de entorno, sin cambiar el código:

1. Crear la base y un usuario propio en MySQL (no use `root` para la aplicación).
2. En el archivo `.env` definir `PASTOREANDO_MOTOR=mysql` y las variables
   `PASTOREANDO_MYSQL_HOST`, `_PUERTO`, `_USUARIO`, `_CLAVE` y `_BASE`
   (ver `.env.example`). La clave solo vive en el `.env`, que no se versiona.
3. Arrancar la aplicación: al iniciar crea las tablas de `sql/esquema_mysql.sql`
   que falten y carga los datos de prueba si la base está vacía.

El módulo `app/infrastructure/conexion_mysql.py` hace que una conexión MySQL se
comporte como la de SQLite (marcadores `?`, filas por nombre, fechas y decimales),
así los repositorios son los mismos con cualquier motor. Para correr toda la
suite contra MySQL, use una base exclusiva de pruebas (se vacía en cada prueba):

```bash
PASTOREANDO_MOTOR=mysql python -m pytest -q
```

## Estándares de código

- Python: `snake_case` para funciones y variables, `PascalCase` para clases,
  `MAYUSCULAS` para constantes, docstrings en cada función pública (PEP 8 y PEP 257).
- JavaScript: `camelCase`, `const` y `let`, `===`, comillas simples, JSDoc.
- SQL: tablas en mayúsculas y columnas en camelCase, igual que el modelo de la Guía 6.
- Consultas siempre parametrizadas (`?`), nunca concatenadas.

## Control de versiones

Ramas `main`, `develop` y `feature/*`. Mensajes de commit con el formato
`tipo: descripción` (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`).

Repositorio: <https://github.com/brayian-piedrahita/pastoreando-software>

## Configuración

Copie `.env.example` como `.env` para cambiar la clave del token y la duración
de la sesión. El archivo `.env` no se sube al repositorio.
