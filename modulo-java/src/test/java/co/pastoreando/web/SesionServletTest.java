package co.pastoreando.web;

import co.pastoreando.apoyo.DAOEnMemoria;
import co.pastoreando.controlador.LoteControlador;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SesionServletTest {

    private final SesionServlet servlet = new SesionServlet();
    private HttpServletRequest peticion;
    private HttpServletResponse respuesta;
    private HttpSession sesion;
    private RequestDispatcher despachador;

    @BeforeEach
    void preparar() {
        DAOEnMemoria dao = new DAOEnMemoria();
        dao.agregarPropietario(1);
        ServletContext contexto = mock(ServletContext.class);
        when(contexto.getAttribute(ContextListener.ATRIBUTO_CONTROLADOR)).thenReturn(new LoteControlador(dao));

        peticion = mock(HttpServletRequest.class);
        respuesta = mock(HttpServletResponse.class);
        sesion = mock(HttpSession.class);
        despachador = mock(RequestDispatcher.class);
        when(peticion.getServletContext()).thenReturn(contexto);
        when(peticion.getContextPath()).thenReturn("/pastoreando");
        when(peticion.getRequestDispatcher(anyString())).thenReturn(despachador);
        when(peticion.getSession(true)).thenReturn(sesion);
    }

    @Test
    void getMuestraElFormularioDeIngreso() throws Exception {
        servlet.doGet(peticion, respuesta);

        verify(peticion).getRequestDispatcher(SesionServlet.VISTA_LOGIN);
        verify(despachador).forward(peticion, respuesta);
    }

    @Test
    void getConSesionAbiertaVaAlTablero() throws Exception {
        when(sesion.getAttribute(SesionServlet.ATRIBUTO_PROPIETARIO)).thenReturn(1);
        when(peticion.getSession(false)).thenReturn(sesion);

        servlet.doGet(peticion, respuesta);

        verify(respuesta).sendRedirect("/pastoreando/lotes");
    }

    @Test
    void salirCierraLaSesion() throws Exception {
        when(peticion.getParameter("accion")).thenReturn("salir");
        when(peticion.getSession(false)).thenReturn(sesion);

        servlet.doGet(peticion, respuesta);

        verify(sesion).invalidate();
        verify(respuesta).sendRedirect("/pastoreando/sesion?cerrada=1");
    }

    @Test
    void unPropietarioValidoAbreSesionYVaAlTablero() throws Exception {
        when(peticion.getParameter("idPropietario")).thenReturn("1");

        servlet.doPost(peticion, respuesta);

        verify(sesion).setAttribute(SesionServlet.ATRIBUTO_PROPIETARIO, 1);
        verify(respuesta).sendRedirect("/pastoreando/lotes");
    }

    @Test
    void descartaLaSesionAnteriorAlIngresar() throws Exception {
        HttpSession anterior = mock(HttpSession.class);
        when(peticion.getSession(false)).thenReturn(anterior);
        when(peticion.getParameter("idPropietario")).thenReturn("1");

        servlet.doPost(peticion, respuesta);

        verify(anterior).invalidate();
    }

    @Test
    void unUsuarioQueNoEsPropietarioVuelveAlFormularioConElError() throws Exception {
        when(peticion.getParameter("idPropietario")).thenReturn("99");

        servlet.doPost(peticion, respuesta);

        verify(sesion, never()).setAttribute(anyString(), org.mockito.ArgumentMatchers.any());
        verify(peticion).setAttribute("error", "El usuario indicado no existe o no tiene el rol de Propietario.");
        verify(peticion).setAttribute("idEscrito", "99");
        verify(despachador).forward(peticion, respuesta);
    }

    @Test
    void unTextoQueNoEsNumeroSeRechaza() throws Exception {
        when(peticion.getParameter("idPropietario")).thenReturn("uno");

        servlet.doPost(peticion, respuesta);

        verify(peticion).setAttribute("error", "El identificador debe ser un numero entero positivo.");
        verify(despachador).forward(peticion, respuesta);
        verify(respuesta, never()).sendRedirect(anyString());
    }
}
