package co.pastoreando.app.modelo;

/** Datos que se envian para calcular el costo por cabeza (RF01 y RF02). */
public final class EntradaCosto {

    private final double alimentacion;
    private final double mantenimiento;
    private final double servicios;
    private final double impuestos;
    private final int cantidadAnimales;
    private final String proposito;

    public EntradaCosto(double alimentacion, double mantenimiento, double servicios,
                        double impuestos, int cantidadAnimales, String proposito) {
        this.alimentacion = alimentacion;
        this.mantenimiento = mantenimiento;
        this.servicios = servicios;
        this.impuestos = impuestos;
        this.cantidadAnimales = cantidadAnimales;
        this.proposito = proposito;
    }

    public double getAlimentacion() {
        return alimentacion;
    }

    public double getMantenimiento() {
        return mantenimiento;
    }

    public double getServicios() {
        return servicios;
    }

    public double getImpuestos() {
        return impuestos;
    }

    public int getCantidadAnimales() {
        return cantidadAnimales;
    }

    /** Proposito en el formato que entiende el servidor (Carne, Leche o Doble Proposito). */
    public String getProposito() {
        return proposito;
    }

    /** Suma de los cuatro rubros del lote. */
    public double getSubtotal() {
        return alimentacion + mantenimiento + servicios + impuestos;
    }
}
