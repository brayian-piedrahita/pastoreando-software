package co.pastoreando.app.dominio;

/**
 * Patron Strategy: cada proposito del ganado aporta su propio factor de manejo
 * al calculo del costo por cabeza (RF01).
 */
public interface EstrategiaCosto {

    /** Valor que el servidor reconoce en el campo proposito. */
    String valorApi();

    /** Multiplicador del costo base por cabeza. */
    double factorManejo();
}
