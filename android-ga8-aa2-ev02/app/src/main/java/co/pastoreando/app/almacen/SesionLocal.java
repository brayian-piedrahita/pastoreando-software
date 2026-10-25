package co.pastoreando.app.almacen;

import android.content.Context;
import android.content.SharedPreferences;

import co.pastoreando.app.modelo.SesionIniciada;
import co.pastoreando.app.modelo.Usuario;

/**
 * Sesion abierta en el telefono: el token de acceso y los datos basicos del usuario. Nunca se
 * guarda la contrasena. Al cerrar la sesion se borra tambien la copia local de los datos.
 */
public final class SesionLocal {

    private static final String ARCHIVO = "sesion_pastoreando";
    private static final String TOKEN = "token";
    private static final String ID = "id_usuario";
    private static final String NOMBRE = "nombre";
    private static final String APELLIDOS = "apellidos";
    private static final String CORREO = "correo";
    private static final String ROL = "rol";

    private final Context contexto;
    private final SharedPreferences preferencias;

    public SesionLocal(Context contexto) {
        this.contexto = contexto.getApplicationContext();
        this.preferencias = this.contexto.getSharedPreferences(ARCHIVO, Context.MODE_PRIVATE);
    }

    public void guardar(SesionIniciada sesion) {
        Usuario usuario = sesion.getUsuario();
        preferencias.edit()
                .putString(TOKEN, sesion.getToken())
                .putInt(ID, usuario.getIdUsuario())
                .putString(NOMBRE, usuario.getNombre())
                .putString(APELLIDOS, usuario.getApellidos())
                .putString(CORREO, usuario.getCorreo())
                .putString(ROL, usuario.getRolTexto())
                .apply();
    }

    public boolean haySesion() {
        return !getToken().isEmpty();
    }

    public String getToken() {
        return preferencias.getString(TOKEN, "");
    }

    public Usuario getUsuario() {
        return new Usuario(
                preferencias.getInt(ID, 0),
                preferencias.getString(NOMBRE, ""),
                preferencias.getString(APELLIDOS, ""),
                preferencias.getString(CORREO, ""),
                preferencias.getString(ROL, ""));
    }

    /** Cierra la sesion y borra los datos guardados de este usuario. */
    public void cerrar() {
        preferencias.edit().clear().apply();
        new CacheLocal(contexto).borrarTodo();
    }
}
