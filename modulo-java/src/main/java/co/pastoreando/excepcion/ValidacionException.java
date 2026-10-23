package co.pastoreando.excepcion;

/**
 * Un dato de entrada no cumple las reglas del dominio (formato, rango u
 * obligatoriedad). Indica el campo para que la vista pueda senalarlo.
 */
public class ValidacionException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String campo;

    public ValidacionException(String campo, String mensaje) {
        super(mensaje);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }
}
