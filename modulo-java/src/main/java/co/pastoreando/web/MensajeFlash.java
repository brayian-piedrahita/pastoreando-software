package co.pastoreando.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.io.Serializable;

/**
 * Mensaje de una sola lectura que sobrevive a una redireccion.
 *
 * <p>Despues de un POST el servlet responde con un redirect (patron
 * Post-Redirect-Get) para que recargar la pagina no repita la operacion. Como
 * un redirect es una peticion nueva, el resultado se deja en la sesion y la
 * siguiente peticion GET lo traslada al request y lo borra.</p>
 */
public final class MensajeFlash implements Serializable {

    public static final String TIPO_EXITO = "exito";
    public static final String TIPO_ERROR = "error";
    public static final String TIPO_AVISO = "aviso";

    /** Nombre del atributo, tanto en la sesion como en el request. */
    public static final String ATRIBUTO = "mensaje";

    private static final long serialVersionUID = 1L;

    private final String tipo;
    private final String texto;

    private MensajeFlash(String tipo, String texto) {
        this.tipo = tipo;
        this.texto = texto;
    }

    public String getTipo() {
        return tipo;
    }

    public String getTexto() {
        return texto;
    }

    /** Deja el mensaje en la sesion para la proxima peticion. */
    public static void guardar(HttpSession sesion, String tipo, String texto) {
        sesion.setAttribute(ATRIBUTO, new MensajeFlash(tipo, texto));
    }

    /** Pasa el mensaje pendiente de la sesion al request y lo elimina de la sesion. */
    public static void trasladarAlRequest(HttpServletRequest peticion) {
        HttpSession sesion = peticion.getSession(false);
        if (sesion == null) {
            return;
        }
        Object pendiente = sesion.getAttribute(ATRIBUTO);
        if (pendiente != null) {
            peticion.setAttribute(ATRIBUTO, pendiente);
            sesion.removeAttribute(ATRIBUTO);
        }
    }
}
