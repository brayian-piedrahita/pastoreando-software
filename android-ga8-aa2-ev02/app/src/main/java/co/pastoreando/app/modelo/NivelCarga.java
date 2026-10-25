package co.pastoreando.app.modelo;

import java.util.Locale;

/**
 * Nivel del semaforo de carga animal de un lote (RF04).
 * NORMAL hasta el 80 % de la capacidad, ALERTA hasta el 100 % y SOBRECARGA por encima.
 */
public enum NivelCarga {
    NORMAL,
    ALERTA,
    SOBRECARGA;

    /** Limite superior del nivel NORMAL, en porcentaje de la capacidad. */
    public static final double LIMITE_NORMAL = 80.0;

    /** Limite superior del nivel ALERTA, en porcentaje de la capacidad. */
    public static final double LIMITE_ALERTA = 100.0;

    /** Clasifica un porcentaje de ocupacion. */
    public static NivelCarga desdePorcentaje(double porcentaje) {
        if (porcentaje > LIMITE_ALERTA) {
            return SOBRECARGA;
        }
        if (porcentaje > LIMITE_NORMAL) {
            return ALERTA;
        }
        return NORMAL;
    }

    /** Clasifica una carga en cabezas frente a la capacidad del lote. */
    public static NivelCarga desdeCarga(int cargaActual, int capacidad) {
        if (capacidad <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor a cero");
        }
        return desdePorcentaje(cargaActual * 100.0 / capacidad);
    }

    /**
     * Interpreta el nivel que envia el servidor. Si el texto falta o no se reconoce,
     * se calcula con el porcentaje, de modo que la pantalla nunca quede sin semaforo.
     */
    public static NivelCarga desdeTexto(String texto, double porcentajeRespaldo) {
        if (texto != null) {
            String limpio = texto.trim().toUpperCase(Locale.ROOT);
            for (NivelCarga nivel : values()) {
                if (nivel.name().equals(limpio)) {
                    return nivel;
                }
            }
        }
        return desdePorcentaje(porcentajeRespaldo);
    }
}
