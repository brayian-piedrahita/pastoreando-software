package co.pastoreando.app.datos;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.Test;

import co.pastoreando.app.dominio.CalculadoraCostos;
import co.pastoreando.app.modelo.EntradaCosto;
import co.pastoreando.app.modelo.ResultadoCosto;
import co.pastoreando.app.modelo.SesionIniciada;

/** Reglas de los repositorios: copia local de lotes y calculo de respaldo sin conexion. */
public class RepositoriosTest {

    private static final EntradaCosto ENTRADA =
            new EntradaCosto(6_000_000, 3_000_000, 1_500_000, 1_500_000, 50, "Carne");

    // ------------------------------------------------------------ autenticacion

    @Test
    public void el_login_envia_las_credenciales_y_devuelve_la_sesion() throws ErrorApi {
        ServicioFalso http = new ServicioFalso().responder(MuestrasJson.LOGIN);

        SesionIniciada sesion = new RepositorioAutenticacion(http).iniciarSesion("carlos@pastoreando.co", "x");

        assertEquals("/auth/login", http.rutas().get(0));
        assertTrue(http.cuerpos().get(0).contains("\"correo\":\"carlos@pastoreando.co\""));
        assertEquals("abc.def.ghi", sesion.getToken());
    }

    @Test
    public void unas_credenciales_incorrectas_llegan_como_no_autenticado() {
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.NO_AUTENTICADO, 401);
        try {
            new RepositorioAutenticacion(http).iniciarSesion("a@b.co", "mala");
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.NO_AUTENTICADO, e.getTipo());
        }
    }

    // ------------------------------------------------------------ lotes

    @Test
    public void los_lotes_del_servidor_se_guardan_como_copia_local() throws ErrorApi {
        ServicioFalso http = new ServicioFalso().responder(MuestrasJson.LOTES);
        AlmacenEnMemoria cache = new AlmacenEnMemoria();

        ListaLotes lista = new RepositorioLotes(http, cache).listar("t", 1);

        assertEquals(2, lista.getLotes().size());
        assertFalse(lista.isDesdeCopiaLocal());
        assertEquals(MuestrasJson.LOTES, cache.leer("lotes_1"));
    }

    @Test
    public void sin_conexion_se_muestra_la_ultima_copia_guardada() throws ErrorApi {
        AlmacenEnMemoria cache = new AlmacenEnMemoria();
        cache.guardar("lotes_1", MuestrasJson.LOTES);
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.SIN_CONEXION, 0);

        ListaLotes lista = new RepositorioLotes(http, cache).listar("t", 1);

        assertTrue(lista.isDesdeCopiaLocal());
        assertEquals(2, lista.getLotes().size());
    }

    @Test
    public void el_tiempo_agotado_tambien_usa_la_copia_guardada() throws ErrorApi {
        AlmacenEnMemoria cache = new AlmacenEnMemoria();
        cache.guardar("lotes_1", MuestrasJson.LOTES);
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.TIEMPO_AGOTADO, 0);

        assertTrue(new RepositorioLotes(http, cache).listar("t", 1).isDesdeCopiaLocal());
    }

    @Test
    public void sin_conexion_y_sin_copia_se_propaga_el_error() {
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.SIN_CONEXION, 0);
        try {
            new RepositorioLotes(http, new AlmacenEnMemoria()).listar("t", 1);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.SIN_CONEXION, e.getTipo());
        }
    }

    @Test
    public void la_copia_de_otro_usuario_no_se_muestra() {
        AlmacenEnMemoria cache = new AlmacenEnMemoria();
        cache.guardar("lotes_2", MuestrasJson.LOTES);
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.SIN_CONEXION, 0);
        try {
            new RepositorioLotes(http, cache).listar("t", 1);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertTrue(e.esDeConexion());
        }
    }

    @Test
    public void una_sesion_vencida_no_usa_la_copia_guardada() {
        AlmacenEnMemoria cache = new AlmacenEnMemoria();
        cache.guardar("lotes_1", MuestrasJson.LOTES);
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.NO_AUTENTICADO, 401);
        try {
            new RepositorioLotes(http, cache).listar("vencido", 1);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.NO_AUTENTICADO, e.getTipo());
        }
    }

    @Test
    public void una_copia_danada_se_ignora_y_sale_el_error_original() {
        AlmacenEnMemoria cache = new AlmacenEnMemoria();
        cache.guardar("lotes_1", "esto no es json");
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.SIN_CONEXION, 0);
        try {
            new RepositorioLotes(http, cache).listar("t", 1);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.SIN_CONEXION, e.getTipo());
        }
    }

    @Test
    public void al_borrar_la_cache_desaparecen_las_copias() {
        AlmacenEnMemoria cache = new AlmacenEnMemoria();
        cache.guardar("lotes_1", MuestrasJson.LOTES);
        cache.borrarTodo();
        assertNull(cache.leer("lotes_1"));
    }

    // ------------------------------------------------------------ costos

    @Test
    public void el_costo_oficial_viene_del_servidor() throws ErrorApi {
        ServicioFalso http = new ServicioFalso().responder(MuestrasJson.COSTO);

        ResultadoCosto costo = new RepositorioCostos(http, new CalculadoraCostos()).calcular("t", ENTRADA);

        assertEquals("/costos/calcular", http.rutas().get(0));
        assertFalse(costo.isCalculadoLocalmente());
        assertEquals(288_000, costo.getCostoUnitarioFinal(), 0.01);
    }

    @Test
    public void sin_conexion_el_costo_se_calcula_en_el_telefono() throws ErrorApi {
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.SIN_CONEXION, 0);

        ResultadoCosto costo = new RepositorioCostos(http, new CalculadoraCostos()).calcular("t", ENTRADA);

        assertTrue(costo.isCalculadoLocalmente());
        assertEquals(288_000, costo.getCostoUnitarioFinal(), 0.01);
    }

    @Test
    public void un_dato_rechazado_por_el_servidor_no_se_recalcula_en_local() {
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.DATOS_INVALIDOS, 422);
        try {
            new RepositorioCostos(http, new CalculadoraCostos()).calcular("t", ENTRADA);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.DATOS_INVALIDOS, e.getTipo());
        }
    }

    @Test
    public void un_rol_sin_permiso_no_obtiene_el_calculo_local() {
        ServicioFalso http = new ServicioFalso().fallar(ErrorApi.Tipo.SIN_PERMISO, 403);
        try {
            new RepositorioCostos(http, new CalculadoraCostos()).calcular("t", ENTRADA);
            fail("Debio lanzar ErrorApi");
        } catch (ErrorApi e) {
            assertEquals(ErrorApi.Tipo.SIN_PERMISO, e.getTipo());
            assertNotNull(e.getTipo());
        }
    }
}
