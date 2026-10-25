package co.pastoreando.app.datos;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/** Error al hablar con el servidor, ya clasificado para que la pantalla muestre el aviso correcto. */
public class ErrorApi extends Exception {

    private static final long serialVersionUID = 1L;

    /** Clases de error que distingue la app. */
    public enum Tipo {
        /** No hay red o no se alcanza el servidor. */
        SIN_CONEXION,
        /** El servidor no respondio a tiempo. */
        TIEMPO_AGOTADO,
        /** 401: credenciales incorrectas o sesion vencida. */
        NO_AUTENTICADO,
        /** 403: el rol no tiene permiso. */
        SIN_PERMISO,
        /** 404: el recurso no existe. */
        NO_ENCONTRADO,
        /** 400 o 422: dato fuera de regla. */
        DATOS_INVALIDOS,
        /** 5xx u otro estado inesperado. */
        SERVIDOR,
        /** La respuesta no tiene la forma esperada. */
        RESPUESTA_INVALIDA
    }

    private final Tipo tipo;
    private final int codigoHttp;
    private final String detalle;
    private final String campo;

    public ErrorApi(Tipo tipo, int codigoHttp, String detalle, String campo, Throwable causa) {
        super(detalle == null || detalle.isEmpty() ? tipo.name() : detalle, causa);
        this.tipo = tipo;
        this.codigoHttp = codigoHttp;
        this.detalle = detalle == null ? "" : detalle;
        this.campo = campo == null ? "" : campo;
    }

    public Tipo getTipo() {
        return tipo;
    }

    public int getCodigoHttp() {
        return codigoHttp;
    }

    /** Texto de detalle que envia el servidor (puede venir vacio). */
    public String getDetalle() {
        return detalle;
    }

    /** Campo al que se refiere el error, si el servidor lo indica. */
    public String getCampo() {
        return campo;
    }

    /** True cuando el fallo es de red y tiene sentido reintentar o usar datos guardados. */
    public boolean esDeConexion() {
        return tipo == Tipo.SIN_CONEXION || tipo == Tipo.TIEMPO_AGOTADO;
    }

    /** Construye el error a partir del estado HTTP y del cuerpo de la respuesta. */
    public static ErrorApi desdeRespuesta(int codigo, String cuerpo) {
        String detalle = "";
        String campo = "";
        try {
            JsonElement raiz = JsonParser.parseString(cuerpo == null ? "" : cuerpo);
            if (raiz.isJsonObject()) {
                JsonObject objeto = raiz.getAsJsonObject();
                detalle = texto(objeto, "detalle");
                campo = texto(objeto, "campo");
            }
        } catch (RuntimeException e) {
            // El cuerpo no era JSON: se queda sin detalle y se informa solo por el estado.
        }
        return new ErrorApi(tipoPorEstado(codigo), codigo, detalle, campo, null);
    }

    /** Falla de red convertida en error de la app. */
    public static ErrorApi deRed(java.io.IOException causa) {
        Tipo tipo = causa instanceof java.net.SocketTimeoutException
                ? Tipo.TIEMPO_AGOTADO
                : Tipo.SIN_CONEXION;
        return new ErrorApi(tipo, 0, "", "", causa);
    }

    /** Respuesta del servidor que no se pudo interpretar. */
    public static ErrorApi respuestaInvalida(Throwable causa) {
        return new ErrorApi(Tipo.RESPUESTA_INVALIDA, 0, "", "", causa);
    }

    static Tipo tipoPorEstado(int codigo) {
        switch (codigo) {
            case 401:
                return Tipo.NO_AUTENTICADO;
            case 403:
                return Tipo.SIN_PERMISO;
            case 404:
                return Tipo.NO_ENCONTRADO;
            case 400:
            case 409:
            case 422:
                return Tipo.DATOS_INVALIDOS;
            default:
                return Tipo.SERVIDOR;
        }
    }

    private static String texto(JsonObject objeto, String clave) {
        JsonElement valor = objeto.get(clave);
        if (valor != null && valor.isJsonPrimitive()) {
            return valor.getAsString();
        }
        return "";
    }
}
