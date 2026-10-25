package co.pastoreando.app.modelo;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Rol del usuario autenticado. La app decide con el rol que opciones muestra;
 * la ultima barrera sigue siendo el servidor, que responde 403 si el rol no tiene permiso.
 */
public enum Rol {
    PROPIETARIO,
    ARRENDATARIO,
    TECNICO,
    CONTADOR,
    DESCONOCIDO;

    /** Convierte el texto del servidor (con o sin tilde) en un rol. */
    public static Rol desde(String texto) {
        if (texto == null) {
            return DESCONOCIDO;
        }
        String limpio = Normalizer.normalize(texto.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT);
        for (Rol rol : values()) {
            if (rol.name().equals(limpio)) {
                return rol;
            }
        }
        return DESCONOCIDO;
    }

    /** El calculo de costos (RF01 y RF02) esta abierto a propietario, arrendatario y contador. */
    public boolean puedeCalcularCostos() {
        return this == PROPIETARIO || this == ARRENDATARIO || this == CONTADOR;
    }
}
