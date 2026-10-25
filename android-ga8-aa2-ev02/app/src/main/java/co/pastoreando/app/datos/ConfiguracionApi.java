package co.pastoreando.app.datos;

/**
 * Configuracion del servidor al que se conecta la app. Un solo lugar para cambiar de ambiente.
 *
 * <p>El servidor de revision esta en un plan gratuito que se duerme tras 15 minutos sin uso;
 * la primera peticion puede tardar cerca de un minuto, por eso los tiempos de espera son largos.
 */
public final class ConfiguracionApi {

    /** Direccion base de la API de revision (HTTPS). Para el emulador local seria http://10.0.2.2:8000/api. */
    public static final String URL_BASE = "https://pastoreando.onrender.com/api";

    /** Tiempo maximo para abrir la conexion. */
    public static final int TIEMPO_CONEXION_MS = 20_000;

    /** Tiempo maximo de lectura: cubre el arranque en frio del servidor. */
    public static final int TIEMPO_LECTURA_MS = 90_000;

    /** Espera entre un intento y el siguiente cuando falla la conexion. */
    public static final int PAUSA_REINTENTO_MS = 2_000;

    /** Intentos para las consultas que no cambian datos (GET) y el inicio de sesion. */
    public static final int INTENTOS_CONSULTA = 2;

    private ConfiguracionApi() {
    }
}
