package co.pastoreando.app.datos;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.util.List;

import org.junit.Test;

import co.pastoreando.app.modelo.EntradaCosto;
import co.pastoreando.app.modelo.Lote;
import co.pastoreando.app.modelo.NivelCarga;
import co.pastoreando.app.modelo.ResultadoCosto;
import co.pastoreando.app.modelo.Rol;
import co.pastoreando.app.modelo.SesionIniciada;

/** Traduccion entre el JSON de la API y el modelo de la app. */
public class ConversorJsonTest {

    @Test
    public void el_cuerpo_del_login_lleva_correo_y_contrasena() {
        String cuerpo = ConversorJson.cuerpoLogin("  carlos@pastoreando.co ", "Clave\"con comillas");
        assertEquals("{\"correo\":\"carlos@pastoreando.co\",\"contrasena\":\"Clave\\\"con comillas\"}", cuerpo);
    }

    @Test
    public void el_cuerpo_del_costo_usa_los_nombres_del_servidor() {
        String cuerpo = ConversorJson.cuerpoCosto(new EntradaCosto(6_000_000, 3_000_000, 1_500_000, 1_500_000, 50, "Carne"));
        assertTrue(cuerpo.contains("\"alimentacion\":6000000"));
        assertTrue(cuerpo.contains("\"cantidad_animales\":50"));
        assertTrue(cuerpo.contains("\"proposito\":\"Carne\""));
    }

    @Test
    public void lee_el_token_y_el_usuario_del_login() throws ErrorApi {
        SesionIniciada sesion = ConversorJson.sesion(MuestrasJson.LOGIN);
        assertEquals("abc.def.ghi", sesion.getToken());
        assertEquals(1, sesion.getUsuario().getIdUsuario());
        assertEquals("Carlos Ramirez Soto", sesion.getUsuario().getNombreCompleto());
        assertEquals(Rol.PROPIETARIO, sesion.getUsuario().getRol());
    }

    @Test
    public void un_login_sin_token_es_una_respuesta_invalida() {
        try {
            ConversorJson.sesion("{\"mensaje\":\"ok\"}");
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.RESPUESTA_INVALIDA, e.getTipo());
        }
    }

    @Test
    public void lee_los_lotes_con_su_estado_de_carga() throws ErrorApi {
        List<Lote> lotes = ConversorJson.lotes(MuestrasJson.LOTES);

        assertEquals(2, lotes.size());
        Lote esperanza = lotes.get(0);
        assertEquals("Potrero La Esperanza", esperanza.getNombreLote());
        assertEquals(12.5, esperanza.getHectareas(), 0.001);
        assertEquals(NivelCarga.ALERTA, esperanza.getEstado().getNivel());
        assertEquals(26, esperanza.getEstado().getCargaActual());
        assertEquals(86.7, esperanza.getEstado().getPorcentaje(), 0.001);

        Lote mirador = lotes.get(1);
        assertEquals(NivelCarga.SOBRECARGA, mirador.getEstado().getNivel());
        assertEquals(4, mirador.getEstado().getExcedente());
        assertEquals("Retirar 4 cabezas\nRotar el hato", mirador.getEstado().getSugerencias());
    }

    @Test
    public void si_el_nivel_falta_se_calcula_con_el_porcentaje() throws ErrorApi {
        String json = "[{\"id_lote\":3,\"nombre_lote\":\"Sin nivel\",\"hectareas\":5,\"capacidad_carga\":10,"
                + "\"tipo_pastura\":\"Kikuyo\",\"estado_carga\":{\"carga_actual\":12,\"capacidad_carga\":10}}]";
        Lote lote = ConversorJson.lotes(json).get(0);
        assertEquals(120.0, lote.getEstado().getPorcentaje(), 0.001);
        assertEquals(NivelCarga.SOBRECARGA, lote.getEstado().getNivel());
    }

    @Test
    public void una_lista_vacia_es_valida() throws ErrorApi {
        assertTrue(ConversorJson.lotes("[]").isEmpty());
    }

    @Test
    public void un_cuerpo_que_no_es_json_se_rechaza() {
        try {
            ConversorJson.lotes("<html>error</html>");
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.RESPUESTA_INVALIDA, e.getTipo());
        }
    }

    @Test
    public void lee_el_costo_con_su_desglose() throws ErrorApi {
        ResultadoCosto costo = ConversorJson.costo(MuestrasJson.COSTO);

        assertEquals(288_000, costo.getCostoUnitarioFinal(), 0.001);
        assertEquals(14_400_000, costo.getTotalLoteFinal(), 0.001);
        assertEquals(48_000, costo.getMargenPorCabeza(), 0.001);
        assertEquals(1.0, costo.getFactorManejo(), 0.001);
        assertEquals(4, costo.getDesglose().size());
        assertEquals("Alimentaci\u00f3n", costo.getDesglose().get(0).getNombre());
        assertEquals(50.0, costo.getDesglose().get(0).getPorcentaje(), 0.001);
        assertEquals(12.5, costo.getDesglose().get(3).getPorcentaje(), 0.001);
        assertEquals(false, costo.isCalculadoLocalmente());
    }
}
