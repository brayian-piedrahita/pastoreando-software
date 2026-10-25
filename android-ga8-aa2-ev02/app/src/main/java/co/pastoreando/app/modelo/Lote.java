package co.pastoreando.app.modelo;

/** Lote de terreno para pastoreo, con su estado de carga. */
public final class Lote {

    private final int idLote;
    private final String nombreLote;
    private final double hectareas;
    private final int capacidadCarga;
    private final String tipoPastura;
    private final EstadoCarga estado;

    public Lote(int idLote, String nombreLote, double hectareas, int capacidadCarga,
                String tipoPastura, EstadoCarga estado) {
        this.idLote = idLote;
        this.nombreLote = nombreLote == null ? "" : nombreLote;
        this.hectareas = hectareas;
        this.capacidadCarga = capacidadCarga;
        this.tipoPastura = tipoPastura == null ? "" : tipoPastura;
        this.estado = estado;
    }

    public int getIdLote() {
        return idLote;
    }

    public String getNombreLote() {
        return nombreLote;
    }

    public double getHectareas() {
        return hectareas;
    }

    public int getCapacidadCarga() {
        return capacidadCarga;
    }

    public String getTipoPastura() {
        return tipoPastura;
    }

    public EstadoCarga getEstado() {
        return estado;
    }
}
