package co.pastoreando.app.datos;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.IOException;
import java.net.ServerSocket;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/** El cliente HTTP clasifica cada fallo y aplica la politica de reintentos. */
public class ClienteApiTest {

    private ServidorSimulado servidor;

    @Before
    public void abrirServidor() throws IOException {
        servidor = new ServidorSimulado();
    }

    @After
    public void cerrarServidor() throws IOException {
        servidor.close();
    }

    private ClienteApi cliente(int lecturaMs) {
        return ClienteApi.paraPruebas(servidor.urlBase(), 2_000, lecturaMs, 10);
    }

    @Test
    public void es_un_singleton_la_instancia_se_comparte() {
        assertSame(ClienteApi.instancia(), ClienteApi.instancia());
    }

    @Test
    public void get_envia_el_token_y_devuelve_el_cuerpo() throws ErrorApi {
        servidor.responder(200, "[{\"id_lote\":1}]");

        RespuestaHttp r = cliente(2_000).get("/lotes", "abc123");

        assertEquals(200, r.getCodigo());
        assertEquals("[{\"id_lote\":1}]", r.getCuerpo());
        ServidorSimulado.Peticion p = servidor.peticiones().get(0);
        assertEquals("GET", p.metodo);
        assertEquals("/lotes", p.ruta);
        assertEquals("Bearer abc123", p.cabeceras.get("authorization"));
    }

    @Test
    public void get_sin_token_no_envia_cabecera_de_autorizacion() throws ErrorApi {
        servidor.responder(200, "{}");
        cliente(2_000).get("/salud", null);
        assertTrue(!servidor.peticiones().get(0).cabeceras.containsKey("authorization"));
    }

    @Test
    public void post_envia_json_en_utf8() throws ErrorApi {
        servidor.responder(200, "{}");

        cliente(2_000).post("/auth/login", "{\"nombre\":\"Mu\u00f1oz\"}", null, false);

        ServidorSimulado.Peticion p = servidor.peticiones().get(0);
        assertEquals("POST", p.metodo);
        assertTrue(p.cabeceras.get("content-type").startsWith("application/json"));
        assertEquals("{\"nombre\":\"Mu\u00f1oz\"}", p.cuerpo);
    }

    @Test
    public void el_401_se_clasifica_como_no_autenticado_con_su_detalle() {
        servidor.responder(401, "{\"mensaje\":\"Error en la autenticacion\",\"detalle\":\"Correo o clave incorrectos\"}");
        try {
            cliente(2_000).post("/auth/login", "{}", null, false);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.NO_AUTENTICADO, e.getTipo());
            assertEquals(401, e.getCodigoHttp());
            assertEquals("Correo o clave incorrectos", e.getDetalle());
        }
    }

    @Test
    public void el_403_se_clasifica_como_sin_permiso() {
        servidor.responder(403, "{\"detalle\":\"Rol sin permiso\"}");
        try {
            cliente(2_000).get("/costos/historial", "t");
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.SIN_PERMISO, e.getTipo());
        }
    }

    @Test
    public void el_422_trae_el_detalle_y_el_campo() {
        servidor.responder(422, "{\"detalle\":\"Debe ser mayor o igual a 0\",\"campo\":\"alimentacion\"}");
        try {
            cliente(2_000).post("/costos/calcular", "{}", "t", false);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.DATOS_INVALIDOS, e.getTipo());
            assertEquals("alimentacion", e.getCampo());
            assertEquals("Debe ser mayor o igual a 0", e.getDetalle());
        }
    }

    @Test
    public void un_error_del_servidor_con_cuerpo_que_no_es_json_se_clasifica_igual() {
        servidor.responder(502, "<html>Bad gateway</html>");
        try {
            cliente(2_000).get("/lotes", "t");
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.SERVIDOR, e.getTipo());
            assertEquals("", e.getDetalle());
        }
    }

    @Test
    public void un_puerto_cerrado_es_sin_conexion_tras_agotar_los_intentos() throws IOException {
        int libre;
        try (ServerSocket s = new ServerSocket(0)) {
            libre = s.getLocalPort();
        }
        ClienteApi sinServidor = ClienteApi.paraPruebas("http://127.0.0.1:" + libre, 500, 500, 10);
        try {
            sinServidor.get("/lotes", "t");
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.SIN_CONEXION, e.getTipo());
            assertTrue(e.esDeConexion());
        }
    }

    @Test
    public void una_lectura_demorada_es_tiempo_agotado() {
        servidor.responderConDemora(200, "{}", 800);
        try {
            cliente(150).post("/costos/calcular", "{}", "t", false);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.TIEMPO_AGOTADO, e.getTipo());
        }
    }

    @Test
    public void get_reintenta_una_vez_si_se_cae_la_conexion() throws ErrorApi {
        servidor.cerrarSinResponder().responder(200, "[]");

        RespuestaHttp r = cliente(2_000).get("/lotes", "t");

        assertEquals("[]", r.getCuerpo());
        assertEquals(2, servidor.peticiones().size());
    }

    @Test
    public void post_sin_reintento_no_repite_la_peticion() {
        servidor.responderConDemora(200, "{}", 600).responder(200, "{}");
        try {
            cliente(150).post("/costos/calcular", "{}", "t", false);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.TIEMPO_AGOTADO, e.getTipo());
            assertEquals(1, servidor.peticiones().size());
        }
    }

    @Test
    public void post_con_reintento_repite_la_peticion_cuando_se_agota_el_tiempo() throws ErrorApi {
        servidor.responderConDemora(200, "{}", 600).responder(200, "{\"ok\":true}");

        RespuestaHttp r = cliente(150).post("/auth/login", "{}", null, true);

        assertEquals("{\"ok\":true}", r.getCuerpo());
        assertEquals(2, servidor.peticiones().size());
    }

    @Test
    public void un_error_de_regla_no_se_reintenta() {
        servidor.responder(422, "{\"detalle\":\"x\"}").responder(200, "{}");
        try {
            cliente(2_000).get("/lotes", "t");
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(1, servidor.peticiones().size());
        }
    }
}
