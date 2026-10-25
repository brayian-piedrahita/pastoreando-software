package co.pastoreando.app.modelo;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Costo por cabeza con margen y desglose por rubro. */
public final class ResultadoCosto {

    private final double subtotalLote;
    private final double costoBasePorCabeza;
    private final double factorManejo;
    private final double margenPorCabeza;
    private final double costoUnitarioFinal;
    private final double totalLoteFinal;
    private final List<RubroCosto> desglose;
    private final boolean calculadoLocalmente;

    public ResultadoCosto(double subtotalLote, double costoBasePorCabeza, double factorManejo,
                          double margenPorCabeza, double costoUnitarioFinal, double totalLoteFinal,
                          List<RubroCosto> desglose, boolean calculadoLocalmente) {
        this.subtotalLote = subtotalLote;
        this.costoBasePorCabeza = costoBasePorCabeza;
        this.factorManejo = factorManejo;
        this.margenPorCabeza = margenPorCabeza;
        this.costoUnitarioFinal = costoUnitarioFinal;
        this.totalLoteFinal = totalLoteFinal;
        this.desglose = Collections.unmodifiableList(new ArrayList<>(desglose));
        this.calculadoLocalmente = calculadoLocalmente;
    }

    public double getSubtotalLote() {
        return subtotalLote;
    }

    public double getCostoBasePorCabeza() {
        return costoBasePorCabeza;
    }

    public double getFactorManejo() {
        return factorManejo;
    }

    public double getMargenPorCabeza() {
        return margenPorCabeza;
    }

    public double getCostoUnitarioFinal() {
        return costoUnitarioFinal;
    }

    public double getTotalLoteFinal() {
        return totalLoteFinal;
    }

    public List<RubroCosto> getDesglose() {
        return desglose;
    }

    /** True cuando el calculo se hizo en el telefono por falta de conexion. */
    public boolean isCalculadoLocalmente() {
        return calculadoLocalmente;
    }
}
