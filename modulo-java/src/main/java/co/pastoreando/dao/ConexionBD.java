package co.pastoreando.dao;

import co.pastoreando.excepcion.AccesoDatosException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Punto unico de acceso a la configuracion de la base de datos (patron Singleton).
 *
 * <p>La instancia guarda la URL y las credenciales leidas una sola vez desde el
 * archivo {@code db.properties}. Cada llamada a {@link #obtenerConexion()}
 * entrega una conexion nueva que el llamador cierra con try-with-resources;
 * asi el mismo codigo sirve despues para los servlets, donde varias peticiones
 * se atienden a la vez y no pueden compartir una sola {@link Connection}.</p>
 *
 * <p>El archivo no vive en el repositorio. Se busca en la ruta indicada con
 * {@code -Dpastoreando.config=<ruta>} y, si no se indica, en
 * {@code <carpeta personal>/.pastoreando/db.properties}.</p>
 */
public final class ConexionBD {

    /** Clase del driver JDBC de MySQL (MySQL Connector/J 8). */
    private static final String DRIVER_MYSQL = "com.mysql.cj.jdbc.Driver";

    /** Propiedad del sistema para indicar otra ruta del archivo de configuracion. */
    public static final String PROPIEDAD_RUTA_CONFIG = "pastoreando.config";

    private static final String CLAVE_URL = "db.url";
    private static final String CLAVE_USUARIO = "db.usuario";
    private static final String CLAVE_CLAVE = "db.clave";

    private static ConexionBD instancia;

    private final String url;
    private final String usuario;
    private final String clave;

    private ConexionBD() {
        cargarDriver();
        Properties configuracion = leerConfiguracion(resolverRutaConfiguracion());
        this.url = exigir(configuracion, CLAVE_URL);
        this.usuario = exigir(configuracion, CLAVE_USUARIO);
        this.clave = configuracion.getProperty(CLAVE_CLAVE, "");
    }

    /** Devuelve la unica instancia, creandola la primera vez que se pide. */
    public static synchronized ConexionBD getInstancia() {
        if (instancia == null) {
            instancia = new ConexionBD();
        }
        return instancia;
    }

    /**
     * Abre una conexion nueva con la base de datos. Quien la recibe debe cerrarla.
     *
     * @throws AccesoDatosException si el servidor no responde o rechaza las credenciales
     */
    public Connection obtenerConexion() {
        try {
            return DriverManager.getConnection(url, usuario, clave);
        } catch (SQLException e) {
            throw new AccesoDatosException(
                    "No fue posible conectar con la base de datos. Verifique que MySQL este en "
                            + "ejecucion y que la URL, el usuario y la clave de db.properties sean "
                            + "correctos. Detalle: " + e.getMessage(), e);
        }
    }

    /** Abre y cierra una conexion para confirmar que la configuracion funciona. */
    public void probarConexion() {
        try (Connection conexion = obtenerConexion()) {
            if (!conexion.isValid(3)) {
                throw new AccesoDatosException("La conexion se abrio pero no responde.", null);
            }
        } catch (SQLException e) {
            throw new AccesoDatosException("No fue posible verificar la conexion: " + e.getMessage(), e);
        }
    }

    /**
     * Registra el driver para que el DriverManager lo reconozca. Con
     * MySQL Connector/J 8 el registro tambien ocurre solo al estar en el
     * classpath, pero cargar la clase explicitamente deja claro cual driver se
     * usa y da un error legible si falta la dependencia.
     */
    private static void cargarDriver() {
        try {
            Class.forName(DRIVER_MYSQL);
        } catch (ClassNotFoundException e) {
            throw new AccesoDatosException(
                    "No se encontro el driver JDBC de MySQL (" + DRIVER_MYSQL + "). "
                            + "Revise la dependencia mysql-connector-j en el pom.xml.", e);
        }
    }

    private static Path resolverRutaConfiguracion() {
        String rutaIndicada = System.getProperty(PROPIEDAD_RUTA_CONFIG);
        if (rutaIndicada != null && !rutaIndicada.isBlank()) {
            return Path.of(rutaIndicada);
        }
        return Path.of(System.getProperty("user.home"), ".pastoreando", "db.properties");
    }

    private static Properties leerConfiguracion(Path ruta) {
        if (!Files.isRegularFile(ruta)) {
            throw new AccesoDatosException(
                    "No se encontro el archivo de configuracion: " + ruta + ". Copie "
                            + "config/db.properties.example a esa ruta y complete su contrasena.", null);
        }
        Properties configuracion = new Properties();
        try (InputStream flujo = Files.newInputStream(ruta)) {
            configuracion.load(flujo);
        } catch (IOException e) {
            throw new AccesoDatosException("No se pudo leer el archivo de configuracion: " + ruta, e);
        }
        return configuracion;
    }

    private static String exigir(Properties configuracion, String clave) {
        String valor = configuracion.getProperty(clave);
        if (valor == null || valor.isBlank()) {
            throw new AccesoDatosException(
                    "Falta la propiedad '" + clave + "' en el archivo de configuracion.", null);
        }
        return valor.trim();
    }
}
