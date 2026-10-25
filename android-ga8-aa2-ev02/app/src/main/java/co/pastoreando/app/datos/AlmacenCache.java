package co.pastoreando.app.datos;

/**
 * Almacen clave-valor para la ultima respuesta correcta de cada consulta. En el telefono se
 * implementa con almacenamiento privado de la app; en las pruebas, con un mapa en memoria.
 */
public interface AlmacenCache {

    void guardar(String clave, String valor);

    /** Devuelve el valor guardado o null si no hay. */
    String leer(String clave);

    /** Borra todo lo guardado; se usa al cerrar la sesion. */
    void borrarTodo();
}
