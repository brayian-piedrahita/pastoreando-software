package co.pastoreando.controlador;

import co.pastoreando.apoyo.DAOEnMemoria;
import co.pastoreando.excepcion.ReglaNegocioException;
import co.pastoreando.excepcion.ValidacionException;
import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.EstadoCarga;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoteControladorTest {

    private static final int PROPIETARIO = 1;
    private static final int OTRO_PROPIETARIO = 6;

    private DAOEnMemoria dao;
    private LoteControlador controlador;

    @BeforeEach
    void preparar() {
        dao = new DAOEnMemoria();
        dao.agregarPropietario(PROPIETARIO);
        dao.agregarPropietario(OTRO_PROPIETARIO);
        controlador = new LoteControlador(dao);
    }

    @Test
    void registraUnLoteNuevoSinGanado() {
        CargaLote carga = controlador.registrarLote(PROPIETARIO, "Lote 01", "20", "40", "Kikuyo");

        assertEquals(1, carga.getLote().getIdLote());
        assertEquals(new BigDecimal("20.00"), carga.getLote().getHectareas());
        assertEquals(0, carga.getCabezasActuales());
        assertEquals(EstadoCarga.NORMAL, carga.getEstado());
    }

    @Test
    void noRegistraConDatosInvalidos() {
        assertThrows(ValidacionException.class,
                () -> controlador.registrarLote(PROPIETARIO, "", "20", "40", "Kikuyo"));
        assertTrue(controlador.listarLotes(PROPIETARIO).isEmpty());
    }

    @Test
    void soloUnPropietarioPuedeRegistrarLotes() {
        assertThrows(ReglaNegocioException.class,
                () -> controlador.registrarLote(99, "Lote 01", "20", "40", "Kikuyo"));
    }

    @Test
    void listaSoloLosLotesDelPropietario() {
        controlador.registrarLote(PROPIETARIO, "Lote 01", "20", "40", "Kikuyo");
        controlador.registrarLote(PROPIETARIO, "Lote 02", "15", "30", "Brachiaria");
        controlador.registrarLote(OTRO_PROPIETARIO, "Lote Ajeno", "30", "60", "Kikuyo");

        List<CargaLote> propios = controlador.listarLotes(PROPIETARIO);

        assertEquals(2, propios.size());
        assertEquals("Lote 01", propios.get(0).getLote().getNombreLote());
    }

    @Test
    void consultaElEstadoDeCargaDeUnLote() {
        controlador.registrarLote(PROPIETARIO, "Lote 01", "20", "40", "Kikuyo");
        dao.simularContratos(1, 1, 38);

        CargaLote carga = controlador.consultarLote(1, PROPIETARIO);

        assertEquals(EstadoCarga.ALERTA, carga.getEstado());
        assertEquals(2, carga.getCupoDisponible());
    }

    @Test
    void noPermiteConsultarUnLoteAjeno() {
        controlador.registrarLote(OTRO_PROPIETARIO, "Lote Ajeno", "30", "60", "Kikuyo");

        assertThrows(ReglaNegocioException.class, () -> controlador.consultarLote(1, PROPIETARIO));
    }

    @Test
    void actualizaLosDatosYRecalculaLaCarga() {
        controlador.registrarLote(PROPIETARIO, "Lote 01", "20", "40", "Kikuyo");
        dao.simularContratos(1, 1, 38);

        CargaLote carga = controlador.actualizarLote(1, PROPIETARIO, "Lote Norte", "20", "30", "Kikuyo");

        assertEquals("Lote Norte", carga.getLote().getNombreLote());
        assertEquals(EstadoCarga.SOBRECARGA, carga.getEstado());
    }

    @Test
    void noActualizaUnLoteAjenoNiInexistente() {
        controlador.registrarLote(OTRO_PROPIETARIO, "Lote Ajeno", "30", "60", "Kikuyo");

        assertThrows(ReglaNegocioException.class,
                () -> controlador.actualizarLote(1, PROPIETARIO, "Lote X", "20", "40", "Kikuyo"));
        assertThrows(ReglaNegocioException.class,
                () -> controlador.actualizarLote(77, PROPIETARIO, "Lote X", "20", "40", "Kikuyo"));
    }

    @Test
    void eliminaUnLoteSinContratos() {
        controlador.registrarLote(PROPIETARIO, "Lote 04", "12", "25", "Pasto Elefante");

        controlador.eliminarLote(1, PROPIETARIO);

        assertTrue(controlador.listarLotes(PROPIETARIO).isEmpty());
    }

    @Test
    void noEliminaUnLoteConContratos() {
        controlador.registrarLote(PROPIETARIO, "Lote 02", "15", "30", "Brachiaria");
        dao.simularContratos(1, 2, 12);

        ReglaNegocioException error = assertThrows(ReglaNegocioException.class,
                () -> controlador.eliminarLote(1, PROPIETARIO));

        assertTrue(error.getMessage().contains("2 contratos asociados"));
        assertEquals(1, controlador.listarLotes(PROPIETARIO).size());
    }

    @Test
    void noEliminaUnLoteAjeno() {
        controlador.registrarLote(OTRO_PROPIETARIO, "Lote Ajeno", "30", "60", "Kikuyo");

        assertThrows(ReglaNegocioException.class, () -> controlador.eliminarLote(1, PROPIETARIO));
        assertEquals(1, controlador.listarLotes(OTRO_PROPIETARIO).size());
    }
}
