package co.pastoreando.app.datos;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Cliente HTTP de la app. Patron Singleton: toda la aplicacion comparte una unica
 * configuracion de servidor, tiempos de espera y politica de reintentos.
 *
 * <p>Usa HttpURLConnection, incluido en Android, para no sumar librerias de red al APK.
 * Debe llamarse siempre desde un hilo de fondo.
 */
public final class ClienteApi implements ServicioHttp {

    private static ClienteApi instancia;

    private final String urlBase;
    private final int tiempoConexionMs;
    private final int tiempoLecturaMs;
    private final int pausaReintentoMs;

    private ClienteApi(String urlBase, int tiempoConexionMs, int tiempoLecturaMs, int pausaReintentoMs) {
        this.urlBase = urlBase;
        this.tiempoConexionMs = tiempoConexionMs;
        this.tiempoLecturaMs = tiempoLecturaMs;
        this.pausaReintentoMs = pausaReintentoMs;
    }

    /** Instancia unica con la configuracion de {@link ConfiguracionApi}. */
    public static synchronized ClienteApi instancia() {
        if (instancia == null) {
            instancia = new ClienteApi(
                    ConfiguracionApi.URL_BASE,
                    ConfiguracionApi.TIEMPO_CONEXION_MS,
                    ConfiguracionApi.TIEMPO_LECTURA_MS,
                    ConfiguracionApi.PAUSA_REINTENTO_MS);
        }
        return instancia;
    }

    /** Cliente independiente para pruebas con un servidor local; no toca la instancia unica. */
    public static ClienteApi paraPruebas(String urlBase, int tiempoConexionMs, int tiempoLecturaMs,
                                         int pausaReintentoMs) {
        return new ClienteApi(urlBase, tiempoConexionMs, tiempoLecturaMs, pausaReintentoMs);
    }

    @Override
    public RespuestaHttp get(String ruta, String token) throws ErrorApi {
        return ejecutar("GET", ruta, null, token, ConfiguracionApi.INTENTOS_CONSULTA);
    }

    @Override
    public RespuestaHttp post(String ruta, String cuerpoJson, String token, boolean reintentar)
            throws ErrorApi {
        return ejecutar("POST", ruta, cuerpoJson, token, reintentar ? ConfiguracionApi.INTENTOS_CONSULTA : 1);
    }

    private RespuestaHttp ejecutar(String metodo, String ruta, String cuerpo, String token, int intentos)
            throws ErrorApi {
        int maximo = Math.max(1, intentos);
        for (int intento = 1; ; intento++) {
            try {
                return intentar(metodo, ruta, cuerpo, token);
            } catch (ErrorApi error) {
                if (!error.esDeConexion() || intento >= maximo) {
                    throw error;
                }
                esperar(error);
            }
        }
    }

    private RespuestaHttp intentar(String metodo, String ruta, String cuerpo, String token)
            throws ErrorApi {
        HttpURLConnection conexion = null;
        try {
            conexion = (HttpURLConnection) new URL(urlBase + ruta).openConnection();
            conexion.setRequestMethod(metodo);
            conexion.setConnectTimeout(tiempoConexionMs);
            conexion.setReadTimeout(tiempoLecturaMs);
            conexion.setRequestProperty("Accept", "application/json");
            if (token != null && !token.isEmpty()) {
                conexion.setRequestProperty("Authorization", "Bearer " + token);
            }
            if (cuerpo != null) {
                conexion.setDoOutput(true);
                conexion.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                try (OutputStream salida = conexion.getOutputStream()) {
                    salida.write(cuerpo.getBytes(StandardCharsets.UTF_8));
                }
            }

            int codigo = conexion.getResponseCode();
            InputStream flujo = codigo >= 400 ? conexion.getErrorStream() : conexion.getInputStream();
            String texto = leer(flujo);
            if (codigo >= 400) {
                throw ErrorApi.desdeRespuesta(codigo, texto);
            }
            return new RespuestaHttp(codigo, texto);
        } catch (IOException e) {
            // Algunas versiones de Android lanzan esta excepcion en lugar de devolver el 401.
            String mensaje = e.getMessage() == null ? "" : e.getMessage().toLowerCase(java.util.Locale.ROOT);
            if (mensaje.contains("authentication challenge")) {
                throw ErrorApi.desdeRespuesta(401, "");
            }
            throw ErrorApi.deRed(e);
        } finally {
            if (conexion != null) {
                conexion.disconnect();
            }
        }
    }

    private void esperar(ErrorApi ultimoError) throws ErrorApi {
        try {
            Thread.sleep(pausaReintentoMs);
        } catch (InterruptedException interrupcion) {
            Thread.currentThread().interrupt();
            throw ultimoError;
        }
    }

    private static String leer(InputStream flujo) throws IOException {
        if (flujo == null) {
            return "";
        }
        try (BufferedReader lector = new BufferedReader(new InputStreamReader(flujo, StandardCharsets.UTF_8))) {
            StringBuilder texto = new StringBuilder();
            char[] bloque = new char[2048];
            int leidos;
            while ((leidos = lector.read(bloque)) != -1) {
                texto.append(bloque, 0, leidos);
            }
            return texto.toString();
        }
    }
}
