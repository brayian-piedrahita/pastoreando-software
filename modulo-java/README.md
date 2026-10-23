# Pastoreando · Módulo Java de lotes

Módulo en Java que gestiona los **lotes** de terreno que un propietario ofrece en arrendamiento y vigila su **carga animal** (RF04): cada lote muestra cuántas cabezas tiene hoy en contratos activos, qué porcentaje de su capacidad ocupa y si está en estado NORMAL, ALERTA o SOBRECARGA. Accede a MySQL con **JDBC** y expone un CRUD completo por consola.

Forma parte del proyecto Pastoreando (GA7 · AA2). Convive con la versión Python/FastAPI del repositorio: usa el mismo modelo de datos (`sql/esquema_mysql.sql`) y las mismas reglas de dominio.

## Requisitos

| Herramienta | Versión probada |
|---|---|
| JDK | 17 o superior (probado con Temurin 21) |
| Maven | 3.9 o superior |
| MySQL Server | 8.4 LTS |

## Estructura

```
modulo-java/
├── pom.xml                      Proyecto Maven (driver MySQL, JUnit 5)
├── config/db.properties.example Plantilla de la conexión (sin credenciales)
├── sql/
│   ├── 01_esquema.sql           Base pastoreando: USUARIOS, LOTES, CONTRATOS, GANADO
│   └── 02_datos_prueba.sql      Usuarios, lotes, contratos y ganado de ejemplo
└── src/
    ├── main/java/co/pastoreando/
    │   ├── Aplicacion.java      Punto de entrada (main)
    │   ├── modelo/              Lote, CargaLote, EstadoCarga
    │   ├── dao/                 ConexionBD (Singleton), LoteDAO, LoteDAOJdbc
    │   ├── controlador/         LoteControlador, ValidadorLote
    │   ├── vista/               MenuConsola
    │   └── excepcion/           ValidacionException, ReglaNegocioException, AccesoDatosException
    └── test/java/co/pastoreando/ Pruebas JUnit 5
```

Se sigue el patrón **MVC** con una capa DAO: la vista solo lee y muestra, el controlador valida y aplica las reglas del negocio, el DAO es el único que escribe SQL y el modelo no conoce a ninguno de los tres.

## Puesta en marcha

Todos los comandos se ejecutan desde la carpeta `modulo-java` en Git Bash.

**1. Crear la base de datos** (pide la contraseña de `root`):

```
mysql -u root -p < sql/01_esquema.sql
mysql -u root -p < sql/02_datos_prueba.sql
```

Para empezar de cero: `DROP DATABASE pastoreando;` y repetir los dos scripts.

**2. Crear el archivo de conexión**, fuera del repositorio:

```
mkdir -p ~/.pastoreando
cp config/db.properties.example ~/.pastoreando/db.properties
```

Abra `~/.pastoreando/db.properties` (en Windows, `C:\Users\<usuario>\.pastoreando\db.properties`) y escriba la contraseña en `db.clave`. El archivo con credenciales nunca se sube a Git: `.gitignore` lo excluye y el repositorio solo guarda la plantilla. Para usar otra ruta: `-Dpastoreando.config=<ruta>`.

**3. Ejecutar la consola:**

```
mvn -q compile exec:java
```

Al iniciar pide el identificador de un usuario con rol Propietario (en los datos de prueba, `1` es Carlos Ramírez y `6` es Marta Londoño).

**4. Ejecutar las pruebas:**

```
mvn test
```

Las pruebas unitarias no necesitan base de datos. Las de integración (`LoteDAOJdbcIntegracionTest`) se omiten solas si MySQL o `db.properties` no están disponibles.

## Datos de prueba y resultado esperado

| Lote | Capacidad | Cabezas en contratos activos | Ocupación | Estado |
|---|---|---|---|---|
| 1 · Lote 01 | 40 | 38 | 95 % | ALERTA |
| 2 · Lote 02 | 30 | 12 | 40 % | NORMAL |
| 3 · Lote 03 | 20 | 24 | 120 % | SOBRECARGA |
| 4 · Lote 04 | 25 | 0 | 0 % | NORMAL (sin contratos: se puede eliminar) |

El contrato finalizado del Lote 01 tiene 10 cabezas que **no** cuentan: la carga solo suma contratos en estado Activo.

## Reglas de negocio

- **Alerta de carga:** NORMAL hasta el 80 % de la capacidad, ALERTA por encima del 80 % y hasta el 100 %, SOBRECARGA por encima del 100 %. La comparación se hace con enteros, de modo que 32 de 40 cabezas (80 % exacto) sigue siendo NORMAL y 33 ya es ALERTA.
- **Validaciones del lote:** nombre de 3 a 50 caracteres sin símbolos (solo letras, números y espacios); hectáreas mayores que cero, con máximo dos decimales; capacidad de carga entera mayor que cero; tipo de pastura obligatorio. Se aceptan decimales con punto o con coma.
- **Propiedad:** el propietario en sesión solo ve, modifica y elimina sus propios lotes (todas las sentencias filtran por `idPropietario`).
- **Eliminación:** un lote con contratos, activos o históricos, no se elimina; se informa cuántos tiene. La clave foránea `ON DELETE RESTRICT` es la segunda defensa.

## JDBC en el módulo

Flujo que sigue cada operación del DAO:

1. `Class.forName("com.mysql.cj.jdbc.Driver")` carga el driver (en `ConexionBD`).
2. `DriverManager.getConnection(url, usuario, clave)` abre la conexión (`ConexionBD.obtenerConexion`).
3. `connection.prepareStatement(sql)` prepara la sentencia con parámetros `?`; los valores se asignan con `setInt`, `setString` y `setBigDecimal`, nunca por concatenación.
4. `executeQuery()` devuelve un `ResultSet` que se recorre con `next()` y `getInt`, `getString` y `getBigDecimal`; `executeUpdate()` devuelve las filas afectadas.
5. `try-with-resources` cierra `ResultSet`, `PreparedStatement` y `Connection` aunque ocurra un error.
6. Los `SQLException` se traducen: los errores 1451 y 1452 de clave foránea se vuelven mensajes de negocio y el resto se envuelve en `AccesoDatosException`.

`ConexionBD` es un **Singleton**: lee la configuración una sola vez y entrega una conexión nueva por llamada, lo que permite reutilizar el mismo DAO en los servlets, donde varias peticiones llegan a la vez.

## Estándar de nombres y codificación

| Elemento | Convención | Ejemplos |
|---|---|---|
| Paquetes | minúsculas, sin guiones | `co.pastoreando.modelo`, `co.pastoreando.dao` |
| Clases e interfaces | PascalCase, sustantivo | `Lote`, `CargaLote`, `LoteControlador` |
| Clase de implementación | interfaz + tecnología | `LoteDAO` → `LoteDAOJdbc` |
| Enumeraciones | PascalCase; valores en MAYÚSCULAS | `EstadoCarga.SOBRECARGA` |
| Excepciones | PascalCase terminado en `Exception` | `ValidacionException` |
| Métodos | camelCase, verbo | `registrarLote`, `buscarPorId` |
| Variables y atributos | camelCase, nombre descriptivo | `idPropietario`, `cabezasActuales` |
| Constantes | MAYÚSCULAS con guion bajo | `UMBRAL_ALERTA`, `SQL_INSERTAR` |
| Pruebas | clase terminada en `Test`; método que describe el comportamiento | `CargaLoteTest.clasificaElEstadoEnLosLimites` |

Reglas adicionales:

- Los identificadores del código van en español, igual que el dominio y las columnas de la base de datos (`nombreLote`, `capacidadCarga`), sin tildes ni eñes. Lo mismo aplica a los mensajes de la consola, los comentarios del código y los scripts SQL: así se ven igual en cualquier terminal de Windows y no dependen de la codificación de caracteres.
- Un nombre de atributo coincide con su columna en MySQL.
- Sangría de 4 espacios, llaves siempre, una sentencia por línea y líneas de hasta unos 120 caracteres.
- Comentarios Javadoc en clases, interfaces y métodos públicos, explicando el porqué y no repitiendo el nombre.
- El SQL solo vive en el DAO, en constantes `SQL_*`, y siempre con `PreparedStatement`.
- Archivos en UTF-8 (`project.build.sourceEncoding` en el `pom.xml`).
- En la consola se recomienda digitar los datos sin tildes (por ejemplo `Lote Norte`, no `Lote Ñandú`), por la misma razón.

## Control de versiones

Flujo Git Flow del proyecto: la entrega se desarrolla en `feature/aa2-ev01` y se marca con la etiqueta `aa2-ev01`. La integración a `develop` y `main` se hace después mediante pull request.

Commits por capa, con el prefijo del tipo de cambio (`feat`, `test`, `docs`, `build`).
