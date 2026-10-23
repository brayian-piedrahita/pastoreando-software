package co.pastoreando.web;

import co.pastoreando.apoyo.DAOEnMemoria;
import co.pastoreando.controlador.LoteControlador;
import co.pastoreando.excepcion.AccesoDatosException;
import jakarta.servlet.ServletContext;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ContextListenerTest {

    @Test
    void entregaElControladorPublicadoEnElContexto() {
        LoteControlador controlador = new LoteControlador(new DAOEnMemoria());
        ServletContext contexto = mock(ServletContext.class);
        when(contexto.getAttribute(ContextListener.ATRIBUTO_CONTROLADOR)).thenReturn(controlador);

        assertSame(controlador, ContextListener.obtenerControlador(contexto));
    }

    @Test
    void sinControladorInformaElMotivoGuardadoAlIniciar() {
        ServletContext contexto = mock(ServletContext.class);
        when(contexto.getAttribute(ContextListener.ATRIBUTO_ERROR_INICIO))
                .thenReturn("No se encontro el archivo de configuracion.");

        AccesoDatosException error = assertThrows(AccesoDatosException.class,
                () -> ContextListener.obtenerControlador(contexto));

        assertTrue(error.getMessage().contains("archivo de configuracion"));
    }

    @Test
    void sinControladorNiMotivoUsaUnMensajeGeneral() {
        ServletContext contexto = mock(ServletContext.class);

        AccesoDatosException error = assertThrows(AccesoDatosException.class,
                () -> ContextListener.obtenerControlador(contexto));

        assertTrue(error.getMessage().contains("acceso a datos"));
    }
}
