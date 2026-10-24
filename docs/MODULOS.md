# Módulos de Pastoreando

Documentación de cada módulo del sistema integrado: qué hace, quién lo usa, qué archivos lo
componen, qué recibe, qué devuelve y con qué pruebas se verifica. Las rutas son las de la API
(`/api/...`); los archivos están relativos a la raíz del repositorio.

Todos los errores de la API tienen la misma forma, `{"detalle": "mensaje", "campo": "nombre o null"}`,
con estos códigos: 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto de estado y
422 dato inválido. La interfaz muestra el mensaje del servidor junto al campo que corresponde.

## Resumen

| # | Módulo | Requisito | Roles | Backend | Frontend (`frontend-react/src/`) |
|---|---|---|---|---|---|
| 1 | Acceso y sesión | Acceso por roles | Todos | `auth_servicio.py`, `routers/auth.py` | `PaginaLogin`, `PaginaRegistro`, `ProveedorSesion` |
| 2 | Lotes y monitoreo de carga | RF04 | Todos (consulta) | `lote_servicio.py`, `routers/lotes.py` | `PaginaMonitoreoCarga`, `TarjetaLote`, `MedidorCarga` |
| 3 | Costos por unidad ganadera | RF01, RF02 | Contador, Propietario, Arrendatario | `costo_servicio.py`, `domain/costo.py` | `PaginaCalculoCosto`, `FormularioCosto`, `DesgloseCostos` |
| 4 | Contratos y ganado | RF05 | Según el contrato | `contrato_servicio.py`, `ganado_servicio.py` | `PaginaContratos`, `PaginaDetalleContrato`, `SeccionGanado` |
| 5 | Documento y firma digital | RF05, RCO04 | Propietario, Arrendatario | `firma_servicio.py`, `routers/firmas.py` | `SeccionFirma` |
| 6 | Pagos | RF06 (recaudo) | Arrendatario, Propietario, Contador | `pago_servicio.py`, `routers/pagos.py` | `SeccionPagos`, `FormularioPago` |
| 7 | Recomendaciones técnicas | RF09 | Técnico (escribe) | `recomendacion_servicio.py` | `PanelRecomendaciones` |
| 8 | Reportes y exportación | RF06, RF03 | Propietario, Contador | `reporte_servicio.py`, `exportacion_servicio.py` | `PaginaReportes`, `utilidades/descargas.js` |
| 9 | Persistencia y operación sin conexión | RNF01 (parcial) | Transversal | `conexion_mysql.py`, `db.py`, `archivos_aplicacion.py` | `almacenLocal.js`, `BannerConexion`, `useConexion` |

## 1. Acceso y sesión

**Propósito.** Registrar usuarios, iniciar sesión y entregar un token JWT con el rol. Todos los demás
módulos exigen ese token.

**Entradas**

| Servicio | Campos | Reglas |
|---|---|---|
| `POST /api/auth/registro` | `nombre`, `apellidos`, `cedula`, `rol`, `correo`, `contrasena`, `codigo_profesional` | Nombre y apellidos solo letras; cédula de 6 a 12 dígitos; correo válido y único; contraseña de 8 a 72 caracteres con letras y números. Técnico y Contador exigen el código de profesional |
| `POST /api/auth/login` | `correo`, `contrasena` | Ambos obligatorios |
| `GET /api/auth/yo` | Encabezado `Authorization: Bearer <token>` | Token vigente (60 minutos por defecto) |

**Salidas.** Registro: 201 con `{"mensaje", "usuario"}` sin contraseña. Login: 200 con `{"mensaje", "token", "tipo", "usuario"}`;
con datos incorrectos, 401 sin revelar cuál falló. Yo: `{"id_usuario", "rol", "nombre"}`. Correo o cédula repetidos: 409.

**Pruebas.** `tests/test_auth.py` (9), `tests/test_registro.py` (25), `frontend-react/src/pruebas/validaciones.test.js`
y `navegacion.test.jsx`.

## 2. Lotes y monitoreo de carga (RF04)

**Propósito.** Mostrar cada lote con su carga actual frente a su capacidad y avisar cuando se sobrepasa.
La carga es la suma de cabezas de los contratos activos del lote. Nivel NORMAL hasta 80 %, ALERTA hasta 100 %
y SOBRECARGA por encima.

**Entradas.** `GET /api/lotes` y `GET /api/lotes/{id}` sin parámetros. Para crear o editar (`POST`, `PUT`, solo el
propietario): `nombre_lote`, `hectareas` (> 0), `capacidad_carga` (> 0), `tipo_pastura`.

**Salidas.** Lista de lotes, cada uno con `estado_carga`: `carga_actual`, `capacidad_carga`, `porcentaje`, `nivel`, `mensaje`,
`excedente` y `sugerencias`. Eliminar un lote con contratos responde 409.

**Pruebas.** `tests/test_lotes.py` (14), `tests/test_dominio.py` (17), `modulosPaginas.test.jsx` y `componentes.test.jsx`.

## 3. Costos por unidad ganadera (RF01 y RF02)

**Propósito.** Calcular el costo por cabeza con desglose por rubro. El factor de manejo depende del propósito
mediante el patrón Strategy: Carne 1,00; Leche 1,10; Doble Propósito 1,05. Se suma el margen del 20 %.

**Entradas.** `POST /api/costos/calcular`: `alimentacion`, `mantenimiento`, `servicios`, `impuestos` (valores del lote; al menos uno mayor a cero),
`cantidad_animales` (> 0) y `proposito`. `GET /api/costos/estrategias` y `GET /api/costos/historial` (este último, solo Contador y Propietario).

**Salidas.** `subtotal_lote`, `costo_base_por_cabeza`, `factor_manejo`, `margen_por_cabeza`, `costo_unitario_final`,
`total_lote_final` y `desglose` (por rubro: valor del lote, valor por cabeza y porcentaje). Con 12.000.000 de costos y
50 animales de carne, el costo final por cabeza es 288.000. Cada cálculo queda en el historial. El técnico recibe 403.

**Pruebas.** `tests/test_costos.py` (10), `tests/test_validaciones.py` (43), `servicios.test.js` y `validaciones.test.js`.

## 4. Contratos y ganado (RF05)

**Propósito.** Administrar los contratos de arrendamiento y el ganado de cada uno. El valor mensual es
cabezas × tarifa y el total es mensual × meses.

**Entradas**

| Servicio | Campos | Quién |
|---|---|---|
| `GET /api/contratos`, `/api/contratos/{id}` | Ninguno | El propietario y el arrendatario ven los suyos; técnico y contador ven todos |
| `POST /api/contratos` | `id_lote`, `id_arrendatario`, `fecha_inicio`, `meses_duracion`, `tarifa_por_cabeza` | Arrendatario (a su nombre) o Propietario del lote |
| `PUT`, `DELETE /api/contratos/{id}` | Los mismos campos y `estado` | Propietario del lote (borrar solo sin ganado) |
| `POST /api/contratos/{id}/ganado` | `raza`, `cantidad_cabezas` (> 0), `proposito` (Carne, Leche o Doble Proposito) | Arrendatario del contrato activo |
| `PUT`, `DELETE /api/ganado/{id}` | Igual que el registro | Arrendatario del contrato |

**Salidas.** Contrato con `nombre_lote`, `nombre_propietario`, `nombre_arrendatario`, `fecha_fin`, `total_cabezas`, `valor_mensual`
y `valor_total`. Ganado con `id_ganado`, `raza`, `cantidad_cabezas`, `proposito` y la alerta de carga del lote. Un contrato ajeno
responde 403 («El contrato pertenece a otras personas»).

**Pruebas.** `tests/test_contratos_ganado.py` (26), `modulosServicios.test.js`, `modulosPaginas.test.jsx` y `modulosUtilidades.test.js`.

## 5. Documento y firma digital (RF05 y RCO04)

**Propósito.** Generar el texto del contrato con sus cláusulas y firmarlo. La firma se guarda sobre la huella SHA-256 del
texto vigente: si el ganado cambia, el texto cambia y las firmas anteriores quedan como desactualizadas.

**Entradas.** `GET /api/contratos/{id}/documento`, `POST /api/contratos/{id}/firma` (sin cuerpo; firma el usuario del token) y
`GET /api/contratos/{id}/firmas`. Firman el propietario del lote y el arrendatario del contrato, una vez cada uno, con el contrato activo.

**Salidas.** Documento: `{"id_contrato", "texto", "huella_sha256"}`. Firmas: `{"huella_actual", "firmas": [...], "firmado_por_ambas_partes"}`;
cada firma trae nombre, rol, fecha y `vigente`. Una segunda firma del mismo usuario responde 409; un técnico recibe 403.

**Pruebas.** `tests/test_firmas.py` (11) y `modulosPaginas.test.jsx` (flujo de firma por rol).

## 6. Pagos

**Propósito.** Registrar los pagos del arrendatario y confirmarlos o rechazarlos. Solo los pagos confirmados cuentan como recaudo.

**Entradas.** `POST /api/contratos/{id}/pagos`: `fecha_pago` (fecha real), `monto_total` (> 0), `metodo_pago` (Efectivo, Transferencia, PSE o
Consignacion); lo registra el arrendatario del contrato activo. `PUT /api/pagos/{id}/estado`: `estado_pago` (Confirmado o Rechazado),
solo el propietario del lote o el contador, una sola vez sobre un pago Pendiente. `GET /api/contratos/{id}/pagos`.

**Salidas.** Pago con `id_pago`, `fecha_pago`, `monto_total`, `metodo_pago` y `estado_pago` (nace Pendiente). Resolver un pago ya resuelto responde 409.

**Pruebas.** `tests/test_pagos.py` (27) y `modulosPaginas.test.jsx`.

## 7. Recomendaciones técnicas (RF09)

**Propósito.** Dejar por escrito la indicación del técnico sobre cada hato para que el arrendatario y el propietario la consulten.

**Entradas.** `POST /api/ganado/{id}/recomendaciones`: `descripcion` de 10 a 500 caracteres sin etiquetas, solo rol Técnico.
`GET` para quien puede ver el contrato; `DELETE /api/recomendaciones/{id}` solo el técnico autor.

**Salidas.** `{"id_recomendacion", "id_ganado", "id_zootecnista", "nombre_tecnico", "fecha_recomendacion", "descripcion"}`.

**Pruebas.** `tests/test_recomendaciones.py` (12) y `modulosPaginas.test.jsx`.

## 8. Reportes y exportación (RF06 y RF03)

**Propósito.** Proyectar la rentabilidad de cada contrato con margen del 20 % y descargarla en Excel y PDF.
Costo estimado = ingreso total / 1,20; utilidad = ingreso − costo; recaudado = pagos confirmados; saldo = ingreso − recaudado.
El propietario ve sus contratos y el contador, todos.

**Entradas.** `GET /api/reportes/rentabilidad`, `/rentabilidad/excel` y `/rentabilidad/pdf`; solo requieren el token.

**Salidas.** JSON con `margen_utilidad`, `contratos` (ingreso, costo estimado, utilidad, recaudado y saldo por contrato) y `totales`.
El Excel (`.xlsx`) trae una hoja con la tabla y fórmulas `SUM` en los totales; el PDF es una hoja A4 horizontal con la misma tabla.
Los archivos se descargan con el nombre `reporte_rentabilidad_AAAAMMDD` (por ejemplo, `reporte_rentabilidad_20261024.xlsx`). Arrendatario y técnico reciben 403.

**Pruebas.** `tests/test_reportes.py` (9), `tests/test_exportacion.py` (12), `clienteApi.test.js` (12) y `modulosPaginas.test.jsx`.

## 9. Persistencia y operación sin conexión

**Propósito.** Guardar los datos en MySQL con las mismas consultas que SQLite, servir la aplicación desde una sola dirección y seguir
mostrando lo último consultado cuando se pierde la red.

**Componentes.** `app/infrastructure/conexion_mysql.py` adapta una conexión PyMySQL a la interfaz de `sqlite3` (marcadores `?`, filas por nombre,
decimales, fechas y violaciones de CHECK); el motor se elige con `PASTOREANDO_MOTOR`. `app/api/archivos_aplicacion.py` sirve React compilado y devuelve
`index.html` para las rutas del cliente, sin tocar las de la API. `GET /api/salud` responde `{"estado": "ok"}` para el control de estado del servidor.
En el navegador, `almacenLocal.js` guarda por usuario las listas de lotes, contratos y el último reporte; `useConexion` detecta la pérdida de red y
`BannerConexion` avisa en rojo. Con datos en caché los botones de descarga se desactivan.

**Pruebas.** `tests/test_adaptador_bd.py` (16), `tests/test_aplicacion_web.py` (13), `almacenLocal.test.js` (4), `hooks.test.jsx` (10) y
la suite completa contra MySQL 8.4 real.

## Cobertura de pruebas

| Parte | Archivos | Pruebas | Resultado |
|---|---|---|---|
| Backend con SQLite | 15 | 248 | 247 aprobadas, 1 omitida (la que solo corre con MySQL) |
| Backend con MySQL 8.4 | 15 | 248 | 248 aprobadas |
| Frontend (Vitest) | 13 | 159 | 159 aprobadas |
