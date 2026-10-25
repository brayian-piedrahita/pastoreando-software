package co.pastoreando.app.dominio;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import co.pastoreando.app.modelo.EntradaCosto;
import co.pastoreando.app.modelo.ResultadoCosto;
import co.pastoreando.app.modelo.RubroCosto;

/** Calculo del costo por cabeza con margen del 20 % (RF01) y desglose por rubro (RF02). */
public class CalculadoraCostosTest {

    private static final double TOLERANCIA = 0.01;
    private final CalculadoraCostos calculadora = new CalculadoraCostos();

    private static EntradaCosto caso(String proposito) {
        return new EntradaCosto(6_000_000, 3_000_000, 1_500_000, 1_500_000, 50, proposito);
    }

    @Test
    public void carne_con_12_millones_y_50_animales_cuesta_288_mil_por_cabeza() {
        ResultadoCosto r = calculadora.calcular(caso("Carne"));
        assertEquals(12_000_000, r.getSubtotalLote(), TOLERANCIA);
        assertEquals(240_000, r.getCostoBasePorCabeza(), TOLERANCIA);
        assertEquals(48_000, r.getMargenPorCabeza(), TOLERANCIA);
        assertEquals(288_000, r.getCostoUnitarioFinal(), TOLERANCIA);
        assertEquals(14_400_000, r.getTotalLoteFinal(), TOLERANCIA);
    }

    @Test
    public void leche_aplica_el_factor_1_10_antes_del_margen() {
        ResultadoCosto r = calculadora.calcular(caso("Leche"));
        assertEquals(1.10, r.getFactorManejo(), TOLERANCIA);
        assertEquals(316_800, r.getCostoUnitarioFinal(), TOLERANCIA);
    }

    @Test
    public void doble_proposito_aplica_el_factor_1_05() {
        ResultadoCosto r = calculadora.calcular(caso("Doble Proposito"));
        assertEquals(302_400, r.getCostoUnitarioFinal(), TOLERANCIA);
    }

    @Test
    public void el_desglose_trae_los_cuatro_rubros_y_suma_100_por_ciento() {
        ResultadoCosto r = calculadora.calcular(caso("Carne"));
        assertEquals(4, r.getDesglose().size());
        double suma = 0;
        for (RubroCosto rubro : r.getDesglose()) {
            suma += rubro.getPorcentaje();
        }
        assertEquals(100.0, suma, TOLERANCIA);
        RubroCosto alimentacion = r.getDesglose().get(0);
        assertEquals("alimentacion", alimentacion.getNombre());
        assertEquals(50.0, alimentacion.getPorcentaje(), TOLERANCIA);
        assertEquals(120_000, alimentacion.getValorPorCabeza(), TOLERANCIA);
    }

    @Test
    public void el_resultado_local_queda_marcado_como_tal() {
        assertTrue(calculadora.calcular(caso("Carne")).isCalculadoLocalmente());
    }

    @Test
    public void un_solo_rubro_con_valor_es_suficiente() {
        ResultadoCosto r = calculadora.calcular(new EntradaCosto(1_000, 0, 0, 0, 10, "Carne"));
        assertEquals(120.0, r.getCostoUnitarioFinal(), TOLERANCIA);
    }

    @Test(expected = IllegalArgumentException.class)
    public void cero_animales_se_rechaza() {
        calculadora.calcular(new EntradaCosto(1_000, 0, 0, 0, 0, "Carne"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void un_rubro_negativo_se_rechaza() {
        calculadora.calcular(new EntradaCosto(-5, 1_000, 0, 0, 10, "Carne"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void todos_los_rubros_en_cero_se_rechazan() {
        calculadora.calcular(new EntradaCosto(0, 0, 0, 0, 10, "Carne"));
    }
}
