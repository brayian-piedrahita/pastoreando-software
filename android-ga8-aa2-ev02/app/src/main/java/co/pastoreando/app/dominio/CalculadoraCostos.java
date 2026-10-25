package co.pastoreando.app.dominio;

import java.util.ArrayList;
import java.util.List;

import co.pastoreando.app.modelo.EntradaCosto;
import co.pastoreando.app.modelo.ResultadoCosto;
import co.pastoreando.app.modelo.RubroCosto;

/**
 * Calculo del costo por cabeza (RF01) y del desglose por rubro (RF02).
 * La app lo usa como respaldo cuando no hay conexion con el servidor: aplica las mismas
 * reglas, con el factor de manejo que entrega la estrategia del proposito.
 */
public final class CalculadoraCostos {

    /** Margen de utilidad que se suma al costo ajustado por cabeza. */
    public static final double MARGEN_UTILIDAD = 0.20;

    private static final String[] RUBROS = {"alimentacion", "mantenimiento", "servicios", "impuestos"};

    /**
     * Calcula el costo final por cabeza.
     *
     * @throws IllegalArgumentException si los datos no cumplen las reglas del negocio
     */
    public ResultadoCosto calcular(EntradaCosto entrada) {
        if (entrada.getCantidadAnimales() <= 0) {
            throw new IllegalArgumentException("La cantidad de animales debe ser mayor a cero");
        }
        double[] valores = {
                entrada.getAlimentacion(), entrada.getMantenimiento(),
                entrada.getServicios(), entrada.getImpuestos()};
        for (double valor : valores) {
            if (valor < 0) {
                throw new IllegalArgumentException("Los rubros no pueden ser negativos");
            }
        }
        double subtotal = entrada.getSubtotal();
        if (subtotal <= 0) {
            throw new IllegalArgumentException("Al menos un rubro debe ser mayor a cero");
        }

        EstrategiaCosto estrategia = FabricaEstrategias.paraProposito(entrada.getProposito());
        int animales = entrada.getCantidadAnimales();
        double base = subtotal / animales;
        double ajustado = base * estrategia.factorManejo();
        double margen = ajustado * MARGEN_UTILIDAD;
        double finalPorCabeza = ajustado + margen;

        List<RubroCosto> desglose = new ArrayList<>();
        for (int i = 0; i < RUBROS.length; i++) {
            desglose.add(new RubroCosto(
                    RUBROS[i],
                    redondear(valores[i]),
                    redondear(valores[i] / animales),
                    redondear(valores[i] / subtotal * 100.0)));
        }

        return new ResultadoCosto(
                redondear(subtotal),
                redondear(base),
                estrategia.factorManejo(),
                redondear(margen),
                redondear(finalPorCabeza),
                redondear(finalPorCabeza * animales),
                desglose,
                true);
    }

    private static double redondear(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}
