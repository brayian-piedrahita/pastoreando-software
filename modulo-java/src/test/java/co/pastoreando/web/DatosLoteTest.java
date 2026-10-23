package co.pastoreando.web;

import co.pastoreando.modelo.Lote;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DatosLoteTest {

    @Test
    void leeLosCamposDelFormularioSinModificarlos() {
        HttpServletRequest peticion = mock(HttpServletRequest.class);
        when(peticion.getParameter("nombreLote")).thenReturn("  Lote Norte ");
        when(peticion.getParameter("hectareas")).thenReturn("12,5");
        when(peticion.getParameter("capacidadCarga")).thenReturn("abc");
        when(peticion.getParameter("tipoPastura")).thenReturn("Kikuyo");

        DatosLote datos = DatosLote.desde(peticion);

        assertEquals("  Lote Norte ", datos.getNombreLote());
        assertEquals("12,5", datos.getHectareas());
        assertEquals("abc", datos.getCapacidadCarga());
        assertEquals("Kikuyo", datos.getTipoPastura());
    }

    @Test
    void unParametroAusenteQuedaVacio() {
        DatosLote datos = DatosLote.desde(mock(HttpServletRequest.class));

        assertEquals("", datos.getIdLote());
        assertEquals("", datos.getNombreLote());
    }

    @Test
    void precargaLosDatosDeUnLoteGuardado() {
        Lote lote = new Lote(7, 1, "Lote 07", new BigDecimal("15.50"), 30, "Brachiaria");

        DatosLote datos = DatosLote.desde(lote);

        assertEquals("7", datos.getIdLote());
        assertEquals("15.50", datos.getHectareas());
        assertEquals("30", datos.getCapacidadCarga());
    }
}
