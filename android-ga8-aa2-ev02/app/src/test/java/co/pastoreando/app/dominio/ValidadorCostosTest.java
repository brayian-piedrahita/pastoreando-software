package co.pastoreando.app.dominio;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import co.pastoreando.app.modelo.EntradaCosto;

/** Validacion del formulario de costos: se detecta el dato malo antes de llamar al servidor. */
public class ValidadorCostosTest {

    private final ValidadorCostos validador = new ValidadorCostos();

    @Test
    public void datos_correctos_producen_la_entrada_numerica() {
        ResultadoValidacion r = validador.validar("6000000", "3000000", "1500000", "1500000", "50", "Carne");
        assertTrue(r.esValido());
        EntradaCosto entrada = r.getEntrada();
        assertEquals(6_000_000, entrada.getAlimentacion(), 0.001);
        assertEquals(50, entrada.getCantidadAnimales());
        assertEquals("Carne", entrada.getProposito());
    }

    @Test
    public void un_rubro_vacio_cuenta_como_cero() {
        ResultadoValidacion r = validador.validar("1000", "", "  ", null, "5", "Leche");
        assertTrue(r.esValido());
        assertEquals(0.0, r.getEntrada().getMantenimiento(), 0.001);
    }

    @Test
    public void acepta_decimales_con_punto() {
        ResultadoValidacion r = validador.validar("1500.50", "0", "0", "0", "3", "Carne");
        assertTrue(r.esValido());
        assertEquals(1500.50, r.getEntrada().getAlimentacion(), 0.001);
    }

    @Test
    public void un_rubro_negativo_marca_ese_campo() {
        ResultadoValidacion r = validador.validar("-5000", "1000", "0", "0", "50", "Carne");
        assertFalse(r.esValido());
        assertEquals(ErrorValidacion.NEGATIVO, r.getErrores().get(CampoCosto.ALIMENTACION));
        assertNull(r.getEntrada());
    }

    @Test
    public void un_texto_no_numerico_marca_ese_campo() {
        ResultadoValidacion r = validador.validar("abc", "1000", "0", "0", "50", "Carne");
        assertEquals(ErrorValidacion.NO_NUMERICO, r.getErrores().get(CampoCosto.ALIMENTACION));
    }

    @Test
    public void todos_los_rubros_en_cero_piden_al_menos_uno() {
        ResultadoValidacion r = validador.validar("0", "0", "", "", "10", "Carne");
        assertEquals(ErrorValidacion.SIN_RUBROS, r.getErrores().get(CampoCosto.ALIMENTACION));
    }

    @Test
    public void cero_animales_se_rechaza() {
        ResultadoValidacion r = validador.validar("1000", "0", "0", "0", "0", "Carne");
        assertEquals(ErrorValidacion.DEBE_SER_POSITIVO, r.getErrores().get(CampoCosto.ANIMALES));
    }

    @Test
    public void animales_vacio_o_decimal_se_rechaza() {
        assertEquals(ErrorValidacion.VACIO,
                validador.validar("1000", "0", "0", "0", "", "Carne").getErrores().get(CampoCosto.ANIMALES));
        assertEquals(ErrorValidacion.NO_ENTERO,
                validador.validar("1000", "0", "0", "0", "2.5", "Carne").getErrores().get(CampoCosto.ANIMALES));
    }

    @Test
    public void varios_errores_se_reportan_a_la_vez() {
        ResultadoValidacion r = validador.validar("-5000", "x", "0", "0", "0", "Carne");
        assertEquals(3, r.getErrores().size());
    }
}
