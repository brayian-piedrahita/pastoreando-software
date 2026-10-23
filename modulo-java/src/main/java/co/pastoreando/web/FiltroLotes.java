package co.pastoreando.web;

import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.EstadoCarga;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Filtra la lista de lotes que recibe el tablero. Es una clase sin dependencias
 * de servlets, de modo que se prueba con JUnit sin levantar un servidor.
 */
public final class FiltroLotes {

    /** Valor del filtro de estado que no descarta ningun lote. */
    public static final String TODOS = "TODOS";

    private FiltroLotes() {
    }

    /**
     * Devuelve los lotes que cumplen ambos criterios.
     *
     * @param estado nombre de un {@link EstadoCarga} o {@code TODOS}; un valor
     *               desconocido se trata como {@code TODOS}
     * @param texto  fragmento que debe aparecer en el nombre o en la pastura
     *               (sin distinguir mayusculas); vacio no filtra
     */
    public static List<CargaLote> aplicar(List<CargaLote> lotes, String estado, String texto) {
        EstadoCarga estadoBuscado = interpretarEstado(estado);
        String fragmento = texto == null ? "" : texto.trim().toLowerCase(Locale.ROOT);

        List<CargaLote> resultado = new ArrayList<>();
        for (CargaLote carga : lotes) {
            if (estadoBuscado != null && carga.getEstado() != estadoBuscado) {
                continue;
            }
            if (!fragmento.isEmpty() && !contiene(carga, fragmento)) {
                continue;
            }
            resultado.add(carga);
        }
        return resultado;
    }

    /** Cuenta los lotes que estan en el estado indicado. */
    public static int contar(List<CargaLote> lotes, EstadoCarga estado) {
        int total = 0;
        for (CargaLote carga : lotes) {
            if (carga.getEstado() == estado) {
                total++;
            }
        }
        return total;
    }

    /** Devuelve el estado pedido o null cuando el filtro no restringe por estado. */
    static EstadoCarga interpretarEstado(String estado) {
        if (estado == null || estado.isBlank() || TODOS.equalsIgnoreCase(estado.trim())) {
            return null;
        }
        try {
            return EstadoCarga.valueOf(estado.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static boolean contiene(CargaLote carga, String fragmento) {
        String nombre = carga.getLote().getNombreLote().toLowerCase(Locale.ROOT);
        String pastura = carga.getLote().getTipoPastura().toLowerCase(Locale.ROOT);
        return nombre.contains(fragmento) || pastura.contains(fragmento);
    }
}
