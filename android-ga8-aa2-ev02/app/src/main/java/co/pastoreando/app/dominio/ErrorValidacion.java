package co.pastoreando.app.dominio;

/**
 * Motivos por los que un dato del formulario no es valido. La capa de dominio solo
 * entrega el motivo; la pantalla lo traduce al texto que ve el usuario.
 */
public enum ErrorValidacion {
    /** El campo obligatorio esta vacio. */
    VACIO,
    /** El texto no es un numero. */
    NO_NUMERICO,
    /** El valor es negativo y no se permite. */
    NEGATIVO,
    /** El valor debe ser mayor a cero. */
    DEBE_SER_POSITIVO,
    /** La cantidad de animales debe ser un entero. */
    NO_ENTERO,
    /** Los cuatro rubros estan en cero. */
    SIN_RUBROS,
    /** El correo no tiene formato valido. */
    CORREO_INVALIDO
}
