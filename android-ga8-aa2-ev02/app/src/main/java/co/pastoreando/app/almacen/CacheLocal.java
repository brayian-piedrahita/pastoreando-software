package co.pastoreando.app.almacen;

import android.content.Context;
import android.content.SharedPreferences;

import co.pastoreando.app.datos.AlmacenCache;

/**
 * Copia de la ultima respuesta correcta de cada consulta, en el almacenamiento privado de la app
 * (SharedPreferences en modo privado): ninguna otra aplicacion puede leerla.
 */
public final class CacheLocal implements AlmacenCache {

    private static final String ARCHIVO = "cache_pastoreando";

    private final SharedPreferences preferencias;

    public CacheLocal(Context contexto) {
        this.preferencias = contexto.getApplicationContext()
                .getSharedPreferences(ARCHIVO, Context.MODE_PRIVATE);
    }

    @Override
    public void guardar(String clave, String valor) {
        preferencias.edit().putString(clave, valor).apply();
    }

    @Override
    public String leer(String clave) {
        return preferencias.getString(clave, null);
    }

    @Override
    public void borrarTodo() {
        preferencias.edit().clear().apply();
    }
}
