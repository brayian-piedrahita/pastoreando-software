package co.pastoreando.app.datos;

/**
 * Contrato de acceso al servidor. Los repositorios dependen de esta interfaz y no del cliente
 * concreto, de modo que las pruebas pueden sustituirlo por un servidor simulado.
 */
public interface ServicioHttp {

    /** Consulta (GET). El token puede ser null en rutas publicas. */
    RespuestaHttp get(String ruta, String token) throws ErrorApi;

    /**
     * Envio de datos (POST) en formato JSON.
     *
     * @param reintentar si es true, un fallo de conexion se reintenta; se usa solo cuando repetir
     *                   la peticion no duplica nada en el servidor
     */
    RespuestaHttp post(String ruta, String cuerpoJson, String token, boolean reintentar) throws ErrorApi;
}
