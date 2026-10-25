package co.pastoreando.app.datos;

import java.util.HashMap;
import java.util.Map;

/** Cache en memoria para las pruebas: hace el papel del almacenamiento privado del telefono. */
final class AlmacenEnMemoria implements AlmacenCache {

    private final Map<String, String> datos = new HashMap<>();

    @Override
    public void guardar(String clave, String valor) {
        datos.put(clave, valor);
    }

    @Override
    public String leer(String clave) {
        return datos.get(clave);
    }

    @Override
    public void borrarTodo() {
        datos.clear();
    }
}
