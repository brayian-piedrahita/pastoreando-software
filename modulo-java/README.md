# Pastoreando · Módulo Java de lotes

Módulo en Java que gestiona los **lotes** de terreno que un propietario ofrece en arrendamiento y vigila su **carga animal** (RF04): cada lote muestra cuántas cabezas tiene hoy en contratos activos, qué porcentaje de su capacidad ocupa y si está en estado NORMAL, ALERTA o SOBRECARGA. Accede a MySQL con **JDBC** y se usa de dos maneras: por **consola** (GA7 · AA2 · EV01) y como **aplicación web con servlets y JSP** sobre Apache Tomcat (GA7 · AA2 · EV02).

Forma parte del proyecto Pastoreando (GA7 · AA2). Convive con la versión Python/FastAPI del repositorio: usa el mismo modelo de datos (`sql/esquema_mysql.sql`) y las mismas reglas de dominio.

## Requisitos

| Herramienta | Versión probada |
|---|---|
| JDK | 17 o superior (probado con Temurin 21) |
| Maven | 3.9 o superior |
| MySQL Server | 8.4 LTS |
| Apache Tomcat | 10.1 o superior (Jakarta Servlet 6.0, JSP 3.1). No sirve Tomcat 9: usa el espacio de nombres `javax` |

## Estructura

```
modulo-java/
├── pom.xml                      Proyecto Maven (WAR: servlets, JSTL, driver MySQL, JUnit 5, Mockito)
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
    │   ├── web/                 ContextListener, filtros, SesionServlet, LoteServlet, FiltroLotes
    │   └── excepcion/           ValidacionException, ReglaNegocioException, AccesoDatosException
    ├── main/webapp/
    │   ├── index.jsp            Punto de entrada: reenvía al ingreso o al tablero
    │   ├── css/pastoreando.css  Estilos (paleta del proyecto, sin dependencias externas)
    │   └── WEB-INF/
    │       ├── web.xml          Descriptor: página de inicio, sesión y páginas de error
    │       ├── vistas/          login.jsp, lotes.jsp, form.jsp, ficha.jsp, error.jsp
    │       └── fragmentos/      cabecera.jspf, pie.jspf, utilidades.jspf, tarjetaLote.jsp
    └── test/java/co/pastoreando/ Pruebas JUnit 5 (y Mockito para los servlets)
```

Se sigue el patrón **MVC** con una capa DAO: la vista solo lee y muestra, el controlador valida y aplica las reglas del negocio, el DAO es el único que escribe SQL y el modelo no conoce a ninguno de los tres. En la versión web la vista son las páginas JSP, los servlets hacen de intermediarios (traducen parámetros HTTP y eligen la página) y `LoteControlador` es el mismo de la consola.

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


## Aplicación web (servlets y JSP)

La misma lógica de la consola se publica como aplicación web. El navegador nunca llega al controlador directamente: cada petición pasa por un servlet, que llama a `LoteControlador` y reenvía el resultado a una página JSP ubicada en `WEB-INF` (no accesible por URL directa).

### Compilar y desplegar

Desde la carpeta `modulo-java`:

```
mvn clean package
```

Genera `target/pastoreando.war`. Para desplegarlo en Tomcat 10.1 (con `JAVA_HOME` apuntando al JDK):

```
cp target/pastoreando.war <carpeta-de-tomcat>/webapps/
<carpeta-de-tomcat>/bin/catalina.bat run
```

Tomcat descomprime el WAR y la aplicación queda en **http://localhost:8080/pastoreando/**. La conexión a MySQL usa el mismo `~/.pastoreando/db.properties` de la consola; si el archivo falta, la aplicación arranca igual y muestra el motivo en la pantalla de error en lugar de fallar el despliegue.

### Rutas, GET y POST

| Ruta | Método | Acción | Resultado |
|---|---|---|---|
| `/sesion` | GET | formulario de ingreso (`?accion=salir` cierra la sesión) | login.jsp |
| `/sesion` | POST | valida el propietario y abre la sesión | redirect a `/lotes` |
| `/lotes` | GET | listar (por defecto) con filtros `estado` y `q` | lotes.jsp |
| `/lotes?accion=nuevo` | GET | formulario vacío | form.jsp |
| `/lotes?accion=editar&idLote=N` | GET | formulario con los datos del lote | form.jsp |
| `/lotes?accion=ver&idLote=N` | GET | ficha de monitoreo con la alerta de carga | ficha.jsp |
| `/lotes?accion=eliminar&idLote=N` | GET | pantalla de confirmación (no borra nada) | ficha.jsp |
| `/lotes` | POST `accion=crear` | registra el lote | redirect a la ficha |
| `/lotes` | POST `accion=actualizar` | guarda los cambios | redirect a la ficha |
| `/lotes` | POST `accion=eliminar` | elimina el lote | redirect a `/lotes` |

Criterio: **GET** solo consulta (los filtros quedan en la URL y se pueden compartir); **POST** modifica datos, por eso viaja en el cuerpo de la petición. Después de cada POST el servlet responde con un redirect (patrón Post-Redirect-Get) y deja el resultado en la sesión como mensaje de una sola lectura, así recargar la página no repite la operación. Si una validación falla, el formulario vuelve con lo escrito y el campo marcado.

### Servlets, filtros y listener

| Clase | Tipo | Función |
|---|---|---|
| `ContextListener` | `ServletContextListener` | Al desplegar, arma el controlador una sola vez y lo comparte por el contexto |
| `CodificacionFilter` | `Filter` (`/*`) | Fija UTF-8 antes de leer los parámetros |
| `SesionFilter` | `Filter` (`/lotes`) | Solo deja pasar a quien ya se identificó como propietario |
| `SesionServlet` | `HttpServlet` (`/sesion`) | Ingreso y salida; descarta la sesión anterior al ingresar |
| `LoteServlet` | `HttpServlet` (`/lotes`) | Listar, ver, crear, actualizar y eliminar lotes |

### Elementos JSP utilizados

| Elemento | Dónde |
|---|---|
| Directiva `page` (`contentType`, `import`, `errorPage`, `isErrorPage`, `trimDirectiveWhitespaces`) | todas las páginas |
| Directiva `taglib` (JSTL `core` y `fmt`) | todas las páginas |
| Directiva `include` (en tiempo de traducción) | `cabecera.jspf`, `pie.jspf` y `utilidades.jspf` |
| Declaración `<%! %>` | `utilidades.jspf`: `claseEstado()`, `ahora()` y la constante de formato |
| Scriptlet `<% %>` | `lotes.jsp` (suma de cabezas), `tarjetaLote.jsp` y `ficha.jsp` |
| Expresión `<%= %>` | número de lotes y cabezas mostrados, clase de color, fecha del pie |
| Acciones estándar | `jsp:include` con `jsp:param` (tarjeta de cada lote) y `jsp:forward` (`index.jsp`) |
| EL y JSTL | `c:out` (escapa todo dato del usuario), `c:if`, `c:choose`, `c:forEach`, `fmt:formatNumber` |
| Comentarios JSP `<%-- --%>` | no llegan al navegador |

Las páginas usan EL y JSTL para casi todo; el Java embebido (declaración, scriptlet y expresión) se limita a la lógica pequeña que la vista necesita.

### Pruebas de la capa web

Los servlets, los filtros y el listener se prueban con JUnit 5 y objetos simulados de Mockito, sin levantar Tomcat; `FiltroLotes`, `DatosLote` y `MensajeFlash` se prueban directamente. `mvn test` ejecuta en total las pruebas de la consola y de la web.

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
| Servlets, filtros y listeners | PascalCase con el tipo como sufijo | `LoteServlet`, `SesionFilter`, `ContextListener` |
| Páginas JSP y fragmentos | camelCase; `.jsp` para páginas y `.jspf` para fragmentos que se incluyen | `lotes.jsp`, `cabecera.jspf` |
| Parámetros HTTP y atributos de request | camelCase, igual que los campos del modelo | `nombreLote`, `capacidadCarga`, `accion` |
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

Flujo Git Flow del proyecto: la consola se desarrolló en `feature/aa2-ev01` (etiqueta `aa2-ev01`) y la aplicación web en `feature/aa2-ev02` (etiqueta `aa2-ev02`), que parte de `develop` e incorpora la rama anterior. La integración a `develop` y `main` se hace después mediante pull request.

Commits por capa, con el prefijo del tipo de cambio (`feat`, `test`, `docs`, `build`).
