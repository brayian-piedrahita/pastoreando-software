package co.pastoreando.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MensajeFlashTest {

    /** Sesion simulada que guarda los atributos en un mapa. */
    private static HttpSession sesionConMapa(Map<String, Object> atributos) {
        HttpSession sesion = mock(HttpSession.class);
        doAnswer(i -> atributos.put(i.getArgument(0), i.getArgument(1)))
                .when(sesion).setAttribute(anyString(), any());
        when(sesion.getAttribute(anyString())).thenAnswer(i -> atributos.get((String) i.getArgument(0)));
        doAnswer(i -> atributos.remove((String) i.getArgument(0))).when(sesion).removeAttribute(anyString());
        return sesion;
    }

    @Test
    void elMensajeSePasaAlRequestUnaSolaVez() {
        Map<String, Object> atributos = new HashMap<>();
        HttpSession sesion = sesionConMapa(atributos);
        HttpServletRequest peticion = mock(HttpServletRequest.class);
        when(peticion.getSession(false)).thenReturn(sesion);

        MensajeFlash.guardar(sesion, MensajeFlash.TIPO_EXITO, "Lote registrado.");
        MensajeFlash.trasladarAlRequest(peticion);

        MensajeFlash.trasladarAlRequest(peticion); // la segunda lectura ya no encuentra nada
        verify(peticion).setAttribute(org.mockito.ArgumentMatchers.eq(MensajeFlash.ATRIBUTO),
                org.mockito.ArgumentMatchers.argThat(m -> m instanceof MensajeFlash
                        && "exito".equals(((MensajeFlash) m).getTipo())
                        && "Lote registrado.".equals(((MensajeFlash) m).getTexto())));
        assertNull(atributos.get(MensajeFlash.ATRIBUTO));
        assertEquals(0, atributos.size());
    }

    @Test
    void sinSesionNoHaceNada() {
        HttpServletRequest peticion = mock(HttpServletRequest.class);
        when(peticion.getSession(false)).thenReturn(null);

        MensajeFlash.trasladarAlRequest(peticion);

        org.mockito.Mockito.verify(peticion, org.mockito.Mockito.never()).setAttribute(anyString(), any());
    }
}
