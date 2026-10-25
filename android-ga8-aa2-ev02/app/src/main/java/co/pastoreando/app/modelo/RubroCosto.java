package co.pastoreando.app.modelo;

/** Una fila del desglose de costos: cuanto pesa un rubro en el lote y por cabeza (RF02). */
public final class RubroCosto {

    private final String nombre;
    private final double valorLote;
    private final double valorPorCabeza;
    private final double porcentaje;

    public RubroCosto(String nombre, double valorLote, double valorPorCabeza, double porcentaje) {
        this.nombre = nombre == null ? "" : nombre;
        this.valorLote = valorLote;
        this.valorPorCabeza = valorPorCabeza;
        this.porcentaje = porcentaje;
    }

    /** Nombre del rubro tal como llega del servidor (alimentacion, mantenimiento, ...). */
    public String getNombre() {
        return nombre;
    }

    public double getValorLote() {
        return valorLote;
    }

    public double getValorPorCabeza() {
        return valorPorCabeza;
    }

    public double getPorcentaje() {
        return porcentaje;
    }
}
