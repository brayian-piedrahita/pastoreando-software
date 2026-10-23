package co.pastoreando.web;

import co.pastoreando.modelo.Lote;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Valores del formulario de lote tal como los escribio el usuario. Se guardan
 * como texto para poder devolverlos al formulario, sin cambios, cuando alguna
 * validacion falla. Es un JavaBean para que las paginas lo lean con EL.
 */
public class DatosLote {

    private String idLote = "";
    private String nombreLote = "";
    private String hectareas = "";
    private String capacidadCarga = "";
    private String tipoPastura = "";

    /** Lee los campos del formulario; un parametro ausente queda como cadena vacia. */
    public static DatosLote desde(HttpServletRequest peticion) {
        DatosLote datos = new DatosLote();
        datos.idLote = texto(peticion.getParameter("idLote"));
        datos.nombreLote = texto(peticion.getParameter("nombreLote"));
        datos.hectareas = texto(peticion.getParameter("hectareas"));
        datos.capacidadCarga = texto(peticion.getParameter("capacidadCarga"));
        datos.tipoPastura = texto(peticion.getParameter("tipoPastura"));
        return datos;
    }

    /** Precarga el formulario de edicion con los datos guardados del lote. */
    public static DatosLote desde(Lote lote) {
        DatosLote datos = new DatosLote();
        datos.idLote = String.valueOf(lote.getIdLote());
        datos.nombreLote = lote.getNombreLote();
        datos.hectareas = lote.getHectareas().toPlainString();
        datos.capacidadCarga = String.valueOf(lote.getCapacidadCarga());
        datos.tipoPastura = lote.getTipoPastura();
        return datos;
    }

    private static String texto(String valor) {
        return valor == null ? "" : valor;
    }

    public String getIdLote() {
        return idLote;
    }

    public String getNombreLote() {
        return nombreLote;
    }

    public String getHectareas() {
        return hectareas;
    }

    public String getCapacidadCarga() {
        return capacidadCarga;
    }

    public String getTipoPastura() {
        return tipoPastura;
    }
}
