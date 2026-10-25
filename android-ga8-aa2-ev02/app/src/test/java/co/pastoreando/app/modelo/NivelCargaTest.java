package co.pastoreando.app.modelo;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/** Reglas del semaforo de carga animal (RF04): normal hasta 80 %, alerta hasta 100 %. */
public class NivelCargaTest {

    @Test
    public void lote_vacio_es_normal() {
        assertEquals(NivelCarga.NORMAL, NivelCarga.desdePorcentaje(0));
    }

    @Test
    public void exactamente_80_por_ciento_sigue_siendo_normal() {
        assertEquals(NivelCarga.NORMAL, NivelCarga.desdePorcentaje(80.0));
    }

    @Test
    public void sobre_el_80_por_ciento_entra_en_alerta() {
        assertEquals(NivelCarga.ALERTA, NivelCarga.desdePorcentaje(80.1));
    }

    @Test
    public void exactamente_100_por_ciento_sigue_en_alerta() {
        assertEquals(NivelCarga.ALERTA, NivelCarga.desdePorcentaje(100.0));
    }

    @Test
    public void sobre_el_100_por_ciento_es_sobrecarga() {
        assertEquals(NivelCarga.SOBRECARGA, NivelCarga.desdePorcentaje(100.1));
    }

    @Test
    public void lote_alto_el_mirador_24_de_20_es_sobrecarga() {
        assertEquals(NivelCarga.SOBRECARGA, NivelCarga.desdeCarga(24, 20));
    }

    @Test
    public void lote_la_esperanza_26_de_30_es_alerta() {
        assertEquals(NivelCarga.ALERTA, NivelCarga.desdeCarga(26, 30));
    }

    @Test
    public void lote_rio_frio_0_de_12_es_normal() {
        assertEquals(NivelCarga.NORMAL, NivelCarga.desdeCarga(0, 12));
    }

    @Test(expected = IllegalArgumentException.class)
    public void capacidad_cero_no_es_valida() {
        NivelCarga.desdeCarga(5, 0);
    }

    @Test
    public void el_texto_del_servidor_se_respeta_sin_importar_mayusculas() {
        assertEquals(NivelCarga.SOBRECARGA, NivelCarga.desdeTexto(" sobrecarga ", 10.0));
    }

    @Test
    public void si_el_texto_no_se_reconoce_se_usa_el_porcentaje() {
        assertEquals(NivelCarga.ALERTA, NivelCarga.desdeTexto("desconocido", 90.0));
        assertEquals(NivelCarga.NORMAL, NivelCarga.desdeTexto(null, 40.0));
    }
}
