package co.pastoreando.excepcion;

/**
 * Fallo tecnico al acceder a la base de datos (configuracion, conexion o
 * sentencia SQL). Envuelve la SQLException original como causa.
 */
public class AccesoDatosException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public AccesoDatosException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}
