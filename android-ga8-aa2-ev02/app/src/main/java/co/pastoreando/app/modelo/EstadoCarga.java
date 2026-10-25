package co.pastoreando.app.modelo;

/** Estado de la carga animal de un lote frente a su capacidad (RF04). */
public final class EstadoCarga {

    private final int cargaActual;
    private final int capacidadCarga;
    private final double porcentaje;
    private final NivelCarga nivel;
    private final String mensaje;
    private final int excedente;
    private final String sugerencias;

    public EstadoCarga(int cargaActual, int capacidadCarga, double porcentaje, NivelCarga nivel,
                       String mensaje, int excedente, String sugerencias) {
        this.cargaActual = cargaActual;
        this.capacidadCarga = capacidadCarga;
        this.porcentaje = porcentaje;
        this.nivel = nivel;
        this.mensaje = mensaje == null ? "" : mensaje;
        this.excedente = excedente;
        this.sugerencias = sugerencias == null ? "" : sugerencias;
    }

    public int getCargaActual() {
        return cargaActual;
    }

    public int getCapacidadCarga() {
        return capacidadCarga;
    }

    public double getPorcentaje() {
        return porcentaje;
    }

    public NivelCarga getNivel() {
        return nivel;
    }

    public String getMensaje() {
        return mensaje;
    }

    public int getExcedente() {
        return excedente;
    }

    public String getSugerencias() {
        return sugerencias;
    }
}
