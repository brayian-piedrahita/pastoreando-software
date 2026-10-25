package co.pastoreando.app.dominio;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/** Patron Strategy: cada proposito aporta su factor de manejo. */
public class EstrategiasCostoTest {

    private static final double TOLERANCIA = 0.0001;

    @Test
    public void los_factores_son_los_del_servidor() {
        assertEquals(1.00, FabricaEstrategias.paraProposito("Carne").factorManejo(), TOLERANCIA);
        assertEquals(1.10, FabricaEstrategias.paraProposito("Leche").factorManejo(), TOLERANCIA);
        assertEquals(1.05, FabricaEstrategias.paraProposito("Doble Proposito").factorManejo(), TOLERANCIA);
    }

    @Test
    public void acepta_el_proposito_con_tilde_y_en_minusculas() {
        EstrategiaCosto estrategia = FabricaEstrategias.paraProposito("  doble prop\u00f3sito ");
        assertTrue(estrategia instanceof EstrategiaDobleProposito);
        assertEquals("Doble Proposito", estrategia.valorApi());
    }

    @Test
    public void se_ofrecen_tres_propositos_en_el_orden_de_la_pantalla() {
        assertEquals(3, FabricaEstrategias.todas().size());
        assertEquals("Carne", FabricaEstrategias.todas().get(0).valorApi());
        assertEquals("Leche", FabricaEstrategias.todas().get(1).valorApi());
        assertEquals("Doble Proposito", FabricaEstrategias.todas().get(2).valorApi());
    }

    @Test(expected = IllegalArgumentException.class)
    public void un_proposito_desconocido_se_rechaza() {
        FabricaEstrategias.paraProposito("Equino");
    }
}
