package co.pastoreando.app.ui;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/** Las cifras se muestran con las convenciones de Colombia: punto de miles y coma decimal. */
public class FormatoTest {

    @Test
    public void los_pesos_llevan_punto_de_miles_y_no_tienen_decimales() {
        assertEquals("$ 288.000", Formato.pesos(288_000));
        assertEquals("$ 14.400.000", Formato.pesos(14_400_000));
        assertEquals("$ 0", Formato.pesos(0));
    }

    @Test
    public void los_pesos_redondean_hacia_arriba_en_la_mitad() {
        assertEquals("$ 1.001", Formato.pesos(1000.5));
    }

    @Test
    public void el_porcentaje_lleva_coma_decimal_y_un_decimal() {
        assertEquals("86,7 %", Formato.porcentaje(86.666));
        assertEquals("120,0 %", Formato.porcentaje(120));
    }

    @Test
    public void el_factor_lleva_dos_decimales() {
        assertEquals("1,10", Formato.factor(1.1));
        assertEquals("1,00", Formato.factor(1));
    }

    @Test
    public void las_hectareas_no_muestran_ceros_sobrantes() {
        assertEquals("12,5", Formato.hectareas(12.5));
        assertEquals("10", Formato.hectareas(10));
    }

    @Test
    public void la_clave_del_rubro_ignora_tildes_y_mayusculas() {
        org.junit.Assert.assertEquals("alimentacion", Formato.claveRubro("Alimentaci\u00f3n"));
        org.junit.Assert.assertEquals("alimentacion", Formato.claveRubro(" ALIMENTACION "));
        org.junit.Assert.assertEquals("", Formato.claveRubro(null));
    }
}
