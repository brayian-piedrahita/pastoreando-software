# Ambientes, configuración y despliegue

Este documento describe cómo se prepara cada ambiente de Pastoreando, qué variables lee la aplicación y cómo
está publicada la versión de revisión. Ninguna clave se escribe aquí ni en el repositorio: los valores secretos
viven en el archivo `.env` (que no se versiona) o en el panel del servidor.

## Ambientes

| Ambiente | Para qué sirve | Base de datos | Interfaz | Dirección |
|---|---|---|---|---|
| Desarrollo | Escribir y depurar | SQLite (`data/pastoreando.db`) o MySQL local | Vite en `http://localhost:5173` con la API en `http://127.0.0.1:8000` | Equipo del desarrollador |
| Pruebas | Ejecutar `pytest` y `vitest` | SQLite temporal por prueba; MySQL en `pastoreando_prueba` | Sin navegador (jsdom) | Equipo del desarrollador |
| Revisión (producción de la evidencia) | Que el instructor use el sistema | MySQL 8.4 en Aiven (plan gratuito, TLS) | React compilado servido por la API | <https://pastoreando.onrender.com> |

Versiones: Python 3.13 (`.python-version`), Node 24.22.1, MySQL 8.4, FastAPI, React 19, Vite 8 y Vitest 5.

## Variables de entorno

| Variable | Obligatoria | Qué hace |
|---|---|---|
| `PASTOREANDO_MOTOR` | No (`sqlite`) | `sqlite` o `mysql` |
| `PASTOREANDO_BD` | No | Ruta del archivo SQLite |
| `PASTOREANDO_MYSQL_HOST`, `_PUERTO`, `_USUARIO`, `_CLAVE`, `_BASE` | Con `mysql` | Datos de conexión; la clave nunca va en el código |
| `PASTOREANDO_MYSQL_CA` / `PASTOREANDO_MYSQL_CA_PEM` | Si el proveedor exige TLS | Ruta o texto del certificado de la autoridad del servidor |
| `PASTOREANDO_JWT_CLAVE` | Sí en producción | Clave que firma los tokens |
| `PASTOREANDO_JWT_MINUTOS` | No (60) | Vigencia de la sesión |
| `PASTOREANDO_CODIGO_PROFESIONAL` | Sí en producción | Código que piden los registros de Técnico y Contador |
| `PASTOREANDO_BCRYPT_RONDAS` | No (12) | Costo del hash de contraseñas |
| `PASTOREANDO_FRONTEND` | No (`frontend`) | Carpeta de la interfaz que sirve la API; en el despliegue es `frontend-react/dist` |
| `PASTOREANDO_FRONTEND_SPA` | No (`0`) | `1` para que las rutas del cliente devuelvan `index.html` |

## Desarrollo local

```bash
python -m venv venv && source venv/Scripts/activate      # Git Bash en Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload                   # API en http://127.0.0.1:8000

cd frontend-react && npm ci && npm run dev                # interfaz en http://localhost:5173
```

Para usar MySQL en el equipo: crear la base y un usuario propio (no `root`), copiar `.env.example` como `.env`,
definir `PASTOREANDO_MOTOR=mysql` y las variables de conexión. Al arrancar, la aplicación crea las tablas de
`sql/esquema_mysql.sql` que falten y carga los datos de prueba si la base está vacía.

## Pruebas

```bash
python -m pytest -q                                  # 297 pruebas con SQLite (296 aprobadas y 1 omitida)
PASTOREANDO_MOTOR=mysql python -m pytest -q          # las mismas contra MySQL (base *_prueba)
cd frontend-react && npm test                        # 161 pruebas con Vitest
python -m black --check app tests && python -m flake8 --max-line-length 88 app tests
cd frontend-react && npm run build                   # compilación de producción
```

Con MySQL cada prueba vacía las tablas; por eso la suite se detiene si el nombre de la base no termina en `_prueba`.

## Despliegue de revisión

La aplicación se publica en una sola dirección: la API FastAPI sirve también el React compilado.

1. **Base de datos.** Servicio MySQL en Aiven, plan gratuito (1 GB). El servidor exige TLS; el
   certificado de la autoridad se descarga desde el panel de Aiven y se guarda en Render como archivo secreto.
2. **Servidor web.** Servicio web de Render (plan gratuito) configurado como describe `render.yaml`, desde la rama
   `feature/ga8-aa1-ev02`. Compila con `pip install -r requirements.txt && cd frontend-react && npm ci && npm run build` y arranca con
   `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Render consulta `/api/salud` para saber si el servicio está sano.
3. **Variables.** Los datos de conexión, la clave de los tokens y el código de profesionales se escriben en el panel de Render
   (Environment). `render.yaml` solo declara sus nombres, sin valores.
4. **Primer arranque.** La aplicación crea las tablas y carga los datos de prueba. El README lista los usuarios de prueba, uno por cada rol.

### Qué esperar al revisar

- El plan gratuito de Render duerme el servicio tras 15 minutos sin visitas. La primera petición después tarda cerca de un minuto en
  despertarlo; las siguientes responden con normalidad.
- El MySQL gratuito de Aiven puede apagarse por inactividad prolongada. Si la aplicación muestra un error de conexión, se enciende desde
  el panel de Aiven (estado «Running») y se recarga la página.
- Cada redespliegue conserva los datos: la carga inicial solo se hace cuando las tablas están vacías.

## Copia de seguridad y recuperación

Los datos viven en MySQL. Una copia lógica se obtiene con `mysqldump` usando las variables de conexión y el certificado TLS, y se restaura
ejecutando el volcado sobre una base vacía. Las copias automáticas diarias (RNF02) no hacen parte de esta entrega.
