package co.pastoreando.app.dominio;

import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;

import co.pastoreando.app.modelo.EntradaCosto;

/** Resultado de validar el formulario de costos: los errores por campo o la entrada lista. */
public final class ResultadoValidacion {

    private final Map<CampoCosto, ErrorValidacion> errores;
    private final EntradaCosto entrada;

    ResultadoValidacion(Map<CampoCosto, ErrorValidacion> errores, EntradaCosto entrada) {
        this.errores = Collections.unmodifiableMap(new EnumMap<>(errores));
        this.entrada = entrada;
    }

    public boolean esValido() {
        return errores.isEmpty();
    }

    public Map<CampoCosto, ErrorValidacion> getErrores() {
        return errores;
    }

    /** Entrada ya convertida a numeros; solo existe si el formulario es valido. */
    public EntradaCosto getEntrada() {
        return entrada;
    }
}
