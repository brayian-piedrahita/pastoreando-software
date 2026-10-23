package co.pastoreando.modelo;

/**
 * Estado de ocupacion de un lote frente a su capacidad de carga forrajera (RF04).
 */
public enum EstadoCarga {

    NORMAL("Normal",
            "La carga del lote esta dentro del rango permitido."),
    ALERTA("Alerta",
            "El lote supera el 80 % de su capacidad de carga: evite recibir mas animales."),
    SOBRECARGA("Sobrecarga",
            "El lote excede su capacidad de carga forrajera: es necesario reubicar animales.");

    private final String etiqueta;
    private final String mensaje;

    EstadoCarga(String etiqueta, String mensaje) {
        this.etiqueta = etiqueta;
        this.mensaje = mensaje;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public String getMensaje() {
        return mensaje;
    }
}
