# Pastoreando · Frontend en React

Interfaz web del proyecto **Pastoreando** (arrendamiento de lotes para pastoreo de ganado bovino),
construida con React y conectada a la API del repositorio (`app/`, FastAPI). Implementa los prototipos
de inicio de sesión, registro, panel, módulo contable, monitoreo de carga y error de conexión, y los
módulos de contratos, ganado, firma digital, pagos, recomendaciones y reportes.

| Requisito | Dónde se resuelve |
|---|---|
| RF01 · Costo por unidad ganadera | `/costos`: `FormularioCosto` + `ResultadoCosto` |
| RF02 · Desglose por rubro | `/costos`: `DesgloseCostos` con vista por unidad o por lote |
| RF04 · Alerta de sobrecarga | `/monitoreo` y `/panel`: `MedidorCarga`, `InsigniaNivel`, `AvisoNivel` |
| RNF01 · Sin conexión | `BannerConexion`, copia local de lotes (`useLotes`) y `/sin-conexion` |
| RF05 · Contrato y firma digital | `/contratos/:id`: `SeccionFirma` (texto, huella SHA-256 y firmas vigentes) |
| Ganado y recomendaciones | `/contratos/:id`: `SeccionGanado` con la alerta RF04 y `PanelRecomendaciones` |
| Pagos | `/contratos/:id`: `SeccionPagos` (registro del arrendatario, confirmación del propietario o contador) |
| RF06 · Reportes de rentabilidad | `/reportes`: ingresos, costo, utilidad con margen del 20 % y recaudo |
| Acceso por rol | `/login`, `/registro`, `RutaProtegida` y `MenuLateral` |

## Requisitos

- Node.js 22.22 o superior (se probó con Node 24 y npm 11).
- La API de Pastoreando en ejecución (Python 3.13, ver el README de la raíz del repositorio).

## Instalación

Desde la carpeta `frontend-react/`:

```bash
npm ci
```

Si la red corta la descarga (error `ECONNRESET`), use:

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" npm ci --maxsockets=3 --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-timeout=120000
```

## Ejecución

1. En la raíz del repositorio, inicie la API (crea `data/pastoreando.db` con datos de prueba):

   ```bash
   python -m uvicorn app.main:app
   ```

2. En otra terminal, dentro de `frontend-react/`, inicie la interfaz:

   ```bash
   npm run dev
   ```

3. Abra <http://127.0.0.1:5173>.

La API no habilita CORS, por eso en desarrollo Vite reenvía todo lo que empieza por `/api` a
`http://127.0.0.1:8000` (ver `vite.config.js`). El navegador solo habla con el puerto 5173. Si la API
corre en otra dirección:

```bash
PASTOREANDO_API=http://127.0.0.1:9000 npm run dev
```

### Usuarios de prueba

Todos usan la contraseña `Pastoreando2026*`.

| Rol | Correo | Qué ve |
|---|---|---|
| Propietario | carlos.ramirez@pastoreando.co | Panel, costos, monitoreo, contratos (firma y confirmación de pagos) y reportes |
| Arrendatario | brayian.piedrahita@pastoreando.co | Panel, costos, monitoreo y contratos (ganado, firma y pagos) |
| Técnico | laura.gomez@pastoreando.co | Panel, monitoreo y contratos (escribe recomendaciones); la API le niega costos y reportes |
| Contador | sandra.bedoya@pastoreando.co | Panel, costos, monitoreo, contratos (confirmación de pagos) y reportes |

## Pruebas y compilación

```bash
npm test          # Vitest + Testing Library: utilidades, servicios, hooks, componentes y navegación
npm run build     # genera dist/ listo para publicar
npm run preview   # sirve dist/ con el mismo reenvío de /api
```

Las pruebas usan una API simulada (`src/pruebas/datos.js`) con respuestas que tienen la misma forma que
las reales, así que no necesitan el servidor encendido.

## Estructura

```text
frontend-react/
  index.html            punto de entrada de Vite
  vite.config.js        React, reenvío de /api y configuración de Vitest
  public/logo.png       logo de la marca (optimizado para conexiones lentas)
  src/
    main.jsx            monta App dentro de BrowserRouter
    App.jsx             rutas y proveedores
    estilos.css         paleta (#4CAF50, #F44336, #F5F5F5), diseño mobile-first
    componentes/        34 componentes reutilizables (incluye Icono)
    paginas/            una página por ruta (10)
    contexto/           ProveedorSesion
    hooks/              useSesion, useConexion, useConsulta, useLotes, useFormulario
    servicios/          clienteApi, servicioAuth, servicioLotes, servicioCostos, servicioContratos,
                        servicioPagos, servicioFirmas, servicioRecomendaciones, servicioReportes, almacenLocal
    utilidades/         formato, validaciones, permisos, errores
    pruebas/            suite de pruebas y datos simulados
```

Cada capa solo habla con la inferior: las páginas coordinan hooks y componentes, los componentes no
conocen la API y los servicios son la única capa que conoce la URL, el token y el formato de error
`{ detalle, campo }`.

## Rutas

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Redirige a `/panel` | — |
| `/login` | Inicio de sesión | Pública |
| `/registro` | Registro de usuarios | Pública |
| `/panel` | Panel de control | Con sesión |
| `/costos` | Módulo contable | Propietario, Arrendatario y Contador |
| `/monitoreo` | Monitoreo ambiental y sobrecarga | Con sesión |
| `/contratos` | Lista de contratos del usuario | Con sesión |
| `/contratos/:idContrato` | Detalle: ganado, recomendaciones, documento y firma, pagos | Con sesión (cada acción según el rol) |
| `/reportes` | Reportes financieros (RF06) | Propietario y Contador |
| `/sin-conexion` | Error de conexión | Pública |
| `*` | Página no encontrada | Pública |

## Decisiones

- **Nivel de carga calculado por la API.** Cada lote llega con `estado_carga` (NORMAL hasta 80 %, ALERTA
  hasta 100 %, SOBRECARGA por encima). La interfaz lo dibuja y no repite la regla, de modo que
  la web, la consola y las pruebas del backend nunca puedan discrepar.
- **Sin bibliotecas de estado ni de estilos.** `Context` para la sesión, `fetch` nativo y CSS propio:
  menos kilobytes en una conexión de campo.
- **Sin conexión.** Cada consulta correcta de lotes, contratos y reportes se guarda en `localStorage` (por
  usuario, y se borra al cerrar sesión) y se usa si después falla la red. El detalle de un contrato y las
  acciones de escribir (registrar ganado, firmar, pagar) necesitan red y lo explican. La sincronización de datos nuevos con IndexedDB queda para una etapa posterior.
- **Sesión.** El token JWT (1 hora) se guarda en `localStorage`. Si la API responde 401 con un token
  enviado, la sesión se cierra y se lleva al inicio de sesión.
- **Permisos.** Cada botón se muestra solo al rol que la API autoriza (registrar ganado y pagos: arrendatario;
  firmar: propietario y arrendatario; confirmar o rechazar pagos: propietario y contador; recomendaciones:
  técnico; reportes: propietario y contador). La API sigue siendo la autoridad y su mensaje de error se
  muestra tal cual.
- **Firma y ganado.** El texto del contrato depende de las cabezas registradas. Si el ganado cambia, el
  documento y la huella se piden de nuevo y las firmas anteriores aparecen como desactualizadas.
