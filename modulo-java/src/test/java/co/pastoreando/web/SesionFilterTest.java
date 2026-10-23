package co.pastoreando.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SesionFilterTest {

    private final SesionFilter filtro = new SesionFilter();
    private HttpServletRequest peticion;
    private HttpServletResponse respuesta;
    private FilterChain cadena;

    @BeforeEach
    void preparar() {
        peticion = mock(HttpServletRequest.class);
        respuesta = mock(HttpServletResponse.class);
        cadena = mock(FilterChain.class);
        when(peticion.getContextPath()).thenReturn("/pastoreando");
    }

    @Test
    void sinSesionEnviaAlIngreso() throws Exception {
        when(peticion.getSession(false)).thenReturn(null);

        filtro.doFilter(peticion, respuesta, cadena);

        verify(respuesta).sendRedirect("/pastoreando/sesion");
        verify(cadena, never()).doFilter(peticion, respuesta);
    }

    @Test
    void sesionSinPropietarioEnviaAlIngreso() throws Exception {
        HttpSession sesion = mock(HttpSession.class);
        when(peticion.getSession(false)).thenReturn(sesion);

        filtro.doFilter(peticion, respuesta, cadena);

        verify(respuesta).sendRedirect("/pastoreando/sesion");
        verify(cadena, never()).doFilter(peticion, respuesta);
    }

    @Test
    void conPropietarioDejaPasar() throws Exception {
        HttpSession sesion = mock(HttpSession.class);
        when(sesion.getAttribute(SesionServlet.ATRIBUTO_PROPIETARIO)).thenReturn(1);
        when(peticion.getSession(false)).thenReturn(sesion);

        filtro.doFilter(peticion, respuesta, cadena);

        verify(cadena).doFilter(peticion, respuesta);
        verify(respuesta, never()).sendRedirect(org.mockito.ArgumentMatchers.anyString());
    }
}
