# ESPECIFICACIONES PASTOREANDO - MODULO BACKEND (SDD)

## 1. Proposito
Sistema para formalizar el arrendamiento de lotes de pastoreo de ganado bovino en Colombia.
Este modulo cubre: acceso por roles, gestion de lotes, alerta de sobrecarga (RF04),
calculo de costo por cabeza con desglose (RF01, RF02), contratos y documento de contrato (RF05)
y registro de ganado. Se entrega como API web (FastAPI) con panel PWA y como consola standalone.

## 2. Reglas no negociables de la pila
- Python 3.13, FastAPI, SQLite (sqlite3 de la libreria estandar), PyJWT, bcrypt, pytest.
- Toda consulta SQL usa marcadores de posicion (?). Nunca se concatenan valores.
- Cada operacion abre su conexion y la cierra al terminar (sin sesiones abiertas).
- Las reglas de negocio se validan en la capa de dominio. Ni la API, ni la consola, ni la base las duplican.
- Las contrasenas se guardan solo como hash bcrypt.
- Una capa solo habla con la inmediatamente inferior. Prohibido SQL en api/ o cli/.
- Nombres: snake_case (funciones y variables), PascalCase (clases), MAYUSCULAS (constantes).

## 3. Flujo logico por capas
Usuario -> (API o CLI) -> Service -> Domain -> Infrastructure (repositorio) -> Base de datos

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Presentacion | app/api, app/cli, frontend | Recibir datos, devolver respuestas, mostrar errores |
| Servicios | app/services | Casos de uso y permisos por rol |
| Dominio | app/domain | Entidades, validaciones, alerta de carga, calculo de costos (Strategy) |
| Infraestructura | app/infrastructure | Conexion Singleton, repositorios, hash y token, datos de prueba |

## 4. Contratos de entrada (API)
| Metodo | Ruta | Rol permitido |
|---|---|---|
| POST | /api/auth/login | Publico |
| GET | /api/lotes, /api/lotes/{id} | Todos los autenticados |
| POST, PUT, DELETE | /api/lotes | Propietario del lote |
| GET | /api/contratos, /api/contratos/{id} | Segun rol (propietario y arrendatario ven los suyos) |
| POST | /api/contratos | Arrendatario (a su nombre) o Propietario |
| PUT, DELETE | /api/contratos/{id} | Propietario del lote |
| GET | /api/contratos/{id}/documento | Quien puede ver el contrato |
| GET, POST | /api/contratos/{id}/ganado | Arrendatario del contrato (POST) |
| PUT, DELETE | /api/ganado/{id} | Arrendatario del contrato |
| POST | /api/costos/calcular | Contador, Propietario, Arrendatario |
| GET | /api/costos/historial | Contador, Propietario |

Contratos de entrada (CLI): python -m app.cli.menu con opciones 1 listar, 2 registrar,
3 modificar, 4 eliminar lote y 5 calcular costo.

## 5. Contratos de salida
- Exito: JSON con diccionarios y listas, o 204 sin cuerpo al eliminar.
- Error: JSON {"detalle": mensaje, "campo": nombre del campo o null}.
- Codigos: 401 sin sesion o credenciales malas, 403 sin permiso, 404 no existe,
  409 conflicto (por ejemplo lote con contratos), 422 dato invalido.

## 6. Reglas de negocio
- Alerta de carga: NORMAL hasta 80 %, ALERTA mayor a 80 % y hasta 100 %, SOBRECARGA mayor a 100 %.
- Carga actual de un lote: suma de cabezas de los contratos en estado Activo.
- Costo por cabeza = (alimentacion + mantenimiento + servicios + impuestos) / animales,
  por el factor de manejo del proposito (Carne 1.00, Leche 1.10, Doble Proposito 1.05),
  mas margen de utilidad del 20 %.
- Valor mensual del contrato = cabezas por tarifa por cabeza. Valor total = mensual por meses.
- Hectareas, capacidad de carga, cantidad de cabezas y tarifa deben ser mayores a cero.

## 7. Criterios de aceptacion
1. Un usuario con clave correcta recibe token con su rol; con clave mala recibe 401 sin revelar cual dato fallo.
2. Un lote con mas cabezas que su capacidad muestra SOBRECARGA y al menos una sugerencia de accion.
3. Con 12.000.000 de costos y 50 animales de carne el costo por cabeza es 288.000.
4. Ningun dato invalido (fecha inexistente, numero negativo, texto con simbolos, longitud excedida) se guarda.
5. Un arrendatario no puede ver ni modificar contratos de otro arrendatario.
6. Todas las pruebas de la carpeta tests pasan y flake8 no reporta errores.

## 8. Fuera de alcance de este modulo
Exportacion PDF y Excel (RF03, RF06), firma digital (RCO04), parcelacion (RF07), alarmas (RF08),
recomendaciones (RF09), sincronizacion con IndexedDB (RNF01 parcial) y respaldos (RNF02).
