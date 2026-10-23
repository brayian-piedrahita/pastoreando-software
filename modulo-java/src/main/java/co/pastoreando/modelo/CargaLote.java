package co.pastoreando.modelo;

/**
 * Carga animal de un lote: relaciona el lote con las cabezas de ganado que
 * tiene hoy en contratos activos y calcula su porcentaje de ocupacion y su
 * estado (RF04).
 *
 * <p>La clasificacion se hace con enteros para que los limites exactos
 * (80 % y 100 %) no dependan del redondeo de un numero decimal.</p>
 */
public class CargaLote {

    /** Porcentaje de ocupacion a partir del cual el lote queda en ALERTA (exclusivo). */
    public static final int UMBRAL_ALERTA = 80;

    /** Porcentaje de ocupacion a partir del cual el lote queda en SOBRECARGA (exclusivo). */
    public static final int UMBRAL_SOBRECARGA = 100;

    private final Lote lote;
    private final int cabezasActuales;

    public CargaLote(Lote lote, int cabezasActuales) {
        if (lote == null) {
            throw new IllegalArgumentException("El lote es obligatorio.");
        }
        if (lote.getCapacidadCarga() <= 0) {
            throw new IllegalArgumentException("La capacidad de carga debe ser mayor que cero.");
        }
        if (cabezasActuales < 0) {
            throw new IllegalArgumentException("Las cabezas actuales no pueden ser negativas.");
        }
        this.lote = lote;
        this.cabezasActuales = cabezasActuales;
    }

    public Lote getLote() {
        return lote;
    }

    public int getCabezasActuales() {
        return cabezasActuales;
    }

    /** Ocupacion del lote como porcentaje de su capacidad (puede superar 100). */
    public double getPorcentajeOcupacion() {
        return cabezasActuales * 100.0 / lote.getCapacidadCarga();
    }

    /** Estado del lote segun los umbrales de alerta y sobrecarga. */
    public EstadoCarga getEstado() {
        long ocupacion = (long) cabezasActuales * 100;
        long capacidad = lote.getCapacidadCarga();
        if (ocupacion > capacidad * UMBRAL_SOBRECARGA) {
            return EstadoCarga.SOBRECARGA;
        }
        if (ocupacion > capacidad * UMBRAL_ALERTA) {
            return EstadoCarga.ALERTA;
        }
        return EstadoCarga.NORMAL;
    }

    /** Cabezas que exceden la capacidad (0 si el lote no esta sobrecargado). */
    public int getCabezasExcedentes() {
        return Math.max(0, cabezasActuales - lote.getCapacidadCarga());
    }

    /** Cabezas que todavia caben en el lote (0 si ya esta lleno o sobrecargado). */
    public int getCupoDisponible() {
        return Math.max(0, lote.getCapacidadCarga() - cabezasActuales);
    }
}
