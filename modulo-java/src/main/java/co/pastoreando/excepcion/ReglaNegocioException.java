package co.pastoreando.excepcion;

/**
 * La operacion es valida en formato, pero la impide una regla del negocio:
 * lote inexistente, propietario distinto, lote con contratos, etc.
 */
public class ReglaNegocioException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public ReglaNegocioException(String mensaje) {
        super(mensaje);
    }
}
