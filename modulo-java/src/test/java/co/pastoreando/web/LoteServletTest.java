package co.pastoreando.web;

import co.pastoreando.apoyo.DAOEnMemoria;
import co.pastoreando.controlador.LoteControlador;
import co.pastoreando.modelo.CargaLote;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LoteServletTest {

    private static final int PROPIETARIO = 1;

    private final LoteServlet servlet = new LoteServlet();
    private DAOEnMemoria dao;
    private LoteControlador controlador;
    private HttpServletRequest peticion;
    private HttpServletResponse respuesta;
    private HttpSession sesion;
    private RequestDispatcher despachador;

    @BeforeEach
    void preparar() {
        dao = new DAOEnMemoria();
        dao.agregarPropietario(PROPIETARIO);
        dao.agregarPropietario(6);
        controlador = new LoteControlador(dao);

        ServletContext contexto = mock(ServletContext.class);
        when(contexto.getAttribute(ContextListener.ATRIBUTO_CONTROLADOR)).thenReturn(controlador);

        peticion = mock(HttpServletRequest.class);
        respuesta = mock(HttpServletResponse.class);
        sesion = mock(HttpSession.class);
        despachador = mock(RequestDispatcher.class);
        when(peticion.getServletContext()).thenReturn(contexto);
        when(peticion.getContextPath()).thenReturn("/pastoreando");
        when(peticion.getSession()).thenReturn(sesion);
        when(peticion.getSession(false)).thenReturn(sesion);
        when(sesion.getAttribute(SesionServlet.ATRIBUTO_PROPIETARIO)).thenReturn(PROPIETARIO);
        when(peticion.getRequestDispatcher(anyString())).thenReturn(despachador);
        when(respuesta.encodeRedirectURL(anyString())).thenAnswer(i -> i.getArgument(0));
    }

    private void parametro(String nombre, String valor) {
        when(peticion.getParameter(nombre)).thenReturn(valor);
    }

    private void formularioValido(String nombre) {
        parametro("nombreLote", nombre);
        parametro("hectareas", "20");
        parametro("capacidadCarga", "40");
        parametro("tipoPastura", "Kikuyo");
    }

    /** Registra tres lotes: 95 % (ALERTA), 40 % (NORMAL) y 120 % (SOBRECARGA). */
    private void sembrarTresLotes() {
        controlador.registrarLote(PROPIETARIO, "Lote 01", "20", "40", "Kikuyo");
        controlador.registrarLote(PROPIETARIO, "Lote 02", "15", "30", "Brachiaria");
        controlador.registrarLote(PROPIETARIO, "Lote 03", "8", "20", "Estrella Africana");
        dao.simularContratos(1, 1, 38);
        dao.simularContratos(2, 1, 12);
        dao.simularContratos(3, 2, 24);
    }

    @SuppressWarnings("unchecked")
    private <T> T atributoPublicado(String nombre, Class<T> tipo) {
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(peticion).setAttribute(eq(nombre), captor.capture());
        return (T) captor.getValue();
    }

    private MensajeFlash mensajeGuardado() {
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(sesion).setAttribute(eq(MensajeFlash.ATRIBUTO), captor.capture());
        return (MensajeFlash) captor.getValue();
    }

    // ---- Seguridad y acciones desconocidas ------------------------------

    @Test
    void sinPropietarioEnSesionRedirigeAlIngreso() throws Exception {
        when(peticion.getSession(false)).thenReturn(null);

        servlet.doGet(peticion, respuesta);
        servlet.doPost(peticion, respuesta);

        verify(respuesta, org.mockito.Mockito.times(2)).sendRedirect("/pastoreando/sesion");
        verify(despachador, never()).forward(any(), any());
    }

    @Test
    void unaAccionDesconocidaResponde400() throws Exception {
        parametro("accion", "borrarTodo");

        servlet.doGet(peticion, respuesta);
        servlet.doPost(peticion, respuesta);

        verify(respuesta, org.mockito.Mockito.times(2))
                .sendError(HttpServletResponse.SC_BAD_REQUEST, "La accion solicitada no existe.");
    }

    @Test
    void unPostSinAccionNoHaceNada() throws Exception {
        servlet.doPost(peticion, respuesta);

        verify(respuesta).sendError(eq(HttpServletResponse.SC_BAD_REQUEST), anyString());
        assertTrue(controlador.listarLotes(PROPIETARIO).isEmpty());
    }

    // ---- GET -------------------------------------------------------------

    @Test
    @SuppressWarnings("unchecked")
    void listaLosLotesConSusTotales() throws Exception {
        sembrarTresLotes();

        servlet.doGet(peticion, respuesta);

        assertEquals(3, atributoPublicado("lotes", List.class).size());
        assertEquals(3, atributoPublicado("totalLotes", Integer.class));
        assertEquals(1, atributoPublicado("totalNormal", Integer.class));
        assertEquals(1, atributoPublicado("totalAlerta", Integer.class));
        assertEquals(1, atributoPublicado("totalSobrecarga", Integer.class));
        verify(peticion).getRequestDispatcher(LoteServlet.VISTA_LISTA);
        verify(despachador).forward(peticion, respuesta);
    }

    @Test
    @SuppressWarnings("unchecked")
    void losFiltrosLlegaronPorLaUrlYRestringenLaLista() throws Exception {
        sembrarTresLotes();
        parametro("estado", "sobrecarga");
        parametro("q", "estrella");

        servlet.doGet(peticion, respuesta);

        List<CargaLote> lotes = atributoPublicado("lotes", List.class);
        assertEquals(1, lotes.size());
        assertEquals(3, lotes.get(0).getLote().getIdLote());
        assertEquals("SOBRECARGA", atributoPublicado("filtroEstado", String.class));
        assertEquals(3, atributoPublicado("totalLotes", Integer.class));
    }

    @Test
    void nuevoMuestraElFormularioVacio() throws Exception {
        parametro("accion", "nuevo");

        servlet.doGet(peticion, respuesta);

        assertEquals("crear", atributoPublicado("modo", String.class));
        assertEquals("", atributoPublicado("datos", DatosLote.class).getNombreLote());
        verify(peticion).getRequestDispatcher(LoteServlet.VISTA_FORMULARIO);
    }

    @Test
    void editarPrecargaLosDatosDelLote() throws Exception {
        sembrarTresLotes();
        parametro("accion", "editar");
        parametro("idLote", "2");

        servlet.doGet(peticion, respuesta);

        assertEquals("actualizar", atributoPublicado("modo", String.class));
        assertEquals("Lote 02", atributoPublicado("datos", DatosLote.class).getNombreLote());
        assertEquals("15.00", atributoPublicado("datos", DatosLote.class).getHectareas());
    }

    @Test
    void verMuestraLaFichaConLaCarga() throws Exception {
        sembrarTresLotes();
        parametro("accion", "ver");
        parametro("idLote", "3");

        servlet.doGet(peticion, respuesta);

        CargaLote carga = atributoPublicado("carga", CargaLote.class);
        assertEquals(24, carga.getCabezasActuales());
        assertFalse(atributoPublicado("confirmarEliminacion", Boolean.class));
        verify(peticion).getRequestDispatcher(LoteServlet.VISTA_FICHA);
    }

    @Test
    void eliminarPorGetSoloPideConfirmacion() throws Exception {
        sembrarTresLotes();
        parametro("accion", "eliminar");
        parametro("idLote", "2");

        servlet.doGet(peticion, respuesta);

        assertTrue(atributoPublicado("confirmarEliminacion", Boolean.class));
        assertEquals(3, controlador.listarLotes(PROPIETARIO).size());
    }

    @Test
    void unLoteAjenoVuelveALaListaConUnError() throws Exception {
        controlador.registrarLote(6, "Lote Ajeno", "30", "60", "Kikuyo");
        parametro("accion", "ver");
        parametro("idLote", "1");

        servlet.doGet(peticion, respuesta);

        assertEquals(MensajeFlash.TIPO_ERROR, mensajeGuardado().getTipo());
        verify(respuesta).sendRedirect("/pastoreando/lotes");
        verify(despachador, never()).forward(any(), any());
    }

    @Test
    void unIdentificadorInvalidoVuelveALaListaConUnError() throws Exception {
        parametro("accion", "ver");
        parametro("idLote", "abc");

        servlet.doGet(peticion, respuesta);

        assertEquals("El identificador debe ser un numero entero positivo.", mensajeGuardado().getTexto());
        verify(respuesta).sendRedirect("/pastoreando/lotes");
    }

    // ---- POST ------------------------------------------------------------

    @Test
    void crearGuardaElLoteYRedirigeConMensaje() throws Exception {
        parametro("accion", "crear");
        formularioValido("Lote Nuevo");

        servlet.doPost(peticion, respuesta);

        assertEquals(1, controlador.listarLotes(PROPIETARIO).size());
        assertEquals(MensajeFlash.TIPO_EXITO, mensajeGuardado().getTipo());
        verify(respuesta).sendRedirect("/pastoreando/lotes?accion=ver&idLote=1");
    }

    @Test
    void crearConDatosInvalidosDevuelveElFormularioConLoEscrito() throws Exception {
        parametro("accion", "crear");
        formularioValido("Lote Nuevo");
        parametro("hectareas", "0");

        servlet.doPost(peticion, respuesta);

        assertTrue(controlador.listarLotes(PROPIETARIO).isEmpty());
        assertEquals("hectareas", atributoPublicado("campoError", String.class));
        assertEquals("Las hectareas deben ser mayores que cero.", atributoPublicado("error", String.class));
        assertEquals("Lote Nuevo", atributoPublicado("datos", DatosLote.class).getNombreLote());
        assertEquals("crear", atributoPublicado("modo", String.class));
        verify(respuesta, never()).sendRedirect(anyString());
        verify(despachador).forward(peticion, respuesta);
    }

    @Test
    void actualizarCambiaElLoteYRedirige() throws Exception {
        sembrarTresLotes();
        parametro("accion", "actualizar");
        parametro("idLote", "2");
        formularioValido("Lote Renombrado");
        parametro("capacidadCarga", "50");

        servlet.doPost(peticion, respuesta);

        CargaLote carga = controlador.consultarLote(2, PROPIETARIO);
        assertEquals("Lote Renombrado", carga.getLote().getNombreLote());
        assertEquals(50, carga.getLote().getCapacidadCarga());
        verify(respuesta).sendRedirect("/pastoreando/lotes?accion=ver&idLote=2");
    }

    @Test
    void actualizarConDatosInvalidosNoCambiaNada() throws Exception {
        sembrarTresLotes();
        parametro("accion", "actualizar");
        parametro("idLote", "2");
        formularioValido("Lote Renombrado");
        parametro("nombreLote", "");

        servlet.doPost(peticion, respuesta);

        assertEquals("Lote 02", controlador.consultarLote(2, PROPIETARIO).getLote().getNombreLote());
        assertEquals("nombreLote", atributoPublicado("campoError", String.class));
        assertEquals("actualizar", atributoPublicado("modo", String.class));
    }

    @Test
    void eliminarUnLoteSinContratosLoBorra() throws Exception {
        controlador.registrarLote(PROPIETARIO, "Lote 04", "12", "25", "Pasto Elefante");
        parametro("accion", "eliminar");
        parametro("idLote", "1");

        servlet.doPost(peticion, respuesta);

        assertTrue(controlador.listarLotes(PROPIETARIO).isEmpty());
        assertEquals(MensajeFlash.TIPO_EXITO, mensajeGuardado().getTipo());
        verify(respuesta).sendRedirect("/pastoreando/lotes");
    }

    @Test
    void eliminarUnLoteConContratosEsRechazado() throws Exception {
        sembrarTresLotes();
        parametro("accion", "eliminar");
        parametro("idLote", "2");

        servlet.doPost(peticion, respuesta);

        assertEquals(3, controlador.listarLotes(PROPIETARIO).size());
        MensajeFlash mensaje = mensajeGuardado();
        assertEquals(MensajeFlash.TIPO_ERROR, mensaje.getTipo());
        assertTrue(mensaje.getTexto().contains("tiene 1 contrato asociado"));
        verify(respuesta).sendRedirect("/pastoreando/lotes");
    }
}
