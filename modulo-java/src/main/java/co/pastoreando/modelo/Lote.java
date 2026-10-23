package co.pastoreando.modelo;

import java.math.BigDecimal;

/**
 * Lote de terreno que un propietario ofrece en arrendamiento para pastoreo.
 * Corresponde a una fila de la tabla LOTES.
 */
public class Lote {

    private int idLote;
    private int idPropietario;
    private String nombreLote;
    private BigDecimal hectareas;
    private int capacidadCarga;
    private String tipoPastura;

    public Lote() {
    }

    public Lote(int idLote, int idPropietario, String nombreLote,
                BigDecimal hectareas, int capacidadCarga, String tipoPastura) {
        this.idLote = idLote;
        this.idPropietario = idPropietario;
        this.nombreLote = nombreLote;
        this.hectareas = hectareas;
        this.capacidadCarga = capacidadCarga;
        this.tipoPastura = tipoPastura;
    }

    public int getIdLote() {
        return idLote;
    }

    public void setIdLote(int idLote) {
        this.idLote = idLote;
    }

    public int getIdPropietario() {
        return idPropietario;
    }

    public void setIdPropietario(int idPropietario) {
        this.idPropietario = idPropietario;
    }

    public String getNombreLote() {
        return nombreLote;
    }

    public void setNombreLote(String nombreLote) {
        this.nombreLote = nombreLote;
    }

    public BigDecimal getHectareas() {
        return hectareas;
    }

    public void setHectareas(BigDecimal hectareas) {
        this.hectareas = hectareas;
    }

    public int getCapacidadCarga() {
        return capacidadCarga;
    }

    public void setCapacidadCarga(int capacidadCarga) {
        this.capacidadCarga = capacidadCarga;
    }

    public String getTipoPastura() {
        return tipoPastura;
    }

    public void setTipoPastura(String tipoPastura) {
        this.tipoPastura = tipoPastura;
    }

    @Override
    public String toString() {
        return "Lote{idLote=" + idLote
                + ", idPropietario=" + idPropietario
                + ", nombreLote='" + nombreLote + '\''
                + ", hectareas=" + hectareas
                + ", capacidadCarga=" + capacidadCarga
                + ", tipoPastura='" + tipoPastura + '\''
                + '}';
    }
}
