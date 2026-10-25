package co.pastoreando.app.dominio;

import java.util.regex.Pattern;

/** Validaciones del formulario de inicio de sesion, antes de tocar la red. */
public final class ValidadorCredenciales {

    private static final Pattern CORREO = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private ValidadorCredenciales() {
    }

    /** Devuelve el error del correo o null si es correcto. */
    public static ErrorValidacion validarCorreo(String correo) {
        String limpio = correo == null ? "" : correo.trim();
        if (limpio.isEmpty()) {
            return ErrorValidacion.VACIO;
        }
        if (!CORREO.matcher(limpio).matches()) {
            return ErrorValidacion.CORREO_INVALIDO;
        }
        return null;
    }

    /** Devuelve el error de la contrasena o null si es correcta. No se recorta: los espacios cuentan. */
    public static ErrorValidacion validarClave(String clave) {
        if (clave == null || clave.isEmpty()) {
            return ErrorValidacion.VACIO;
        }
        return null;
    }
}
