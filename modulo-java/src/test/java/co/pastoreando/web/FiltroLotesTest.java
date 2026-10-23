package co.pastoreando.web;

import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.EstadoCarga;
import co.pastoreando.modelo.Lote;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FiltroLotesTest {

    private List<CargaLote> lotes;

    @BeforeEach
    void preparar() {
        lotes = List.of(
                carga(1, "Lote Norte", "Kikuyo", 40, 38),        // 95 %: ALERTA
                carga(2, "Lote Sur", "Brachiaria", 30, 12),      // 40 %: NORMAL
                carga(3, "Lote Rio", "Estrella Africana", 20, 24), // 120 %: SOBRECARGA
                carga(4, "Lote Kikuyal", "Pasto Elefante", 25, 0)); // 0 %: NORMAL
    }

    private static CargaLote carga(int id, String nombre, String pastura, int capacidad, int cabezas) {
        return new CargaLote(new Lote(id, 1, nombre, new BigDecimal("10.00"), capacidad, pastura), cabezas);
    }

    @Test
    void sinCriteriosDevuelveTodosLosLotes() {
        assertEquals(4, FiltroLotes.aplicar(lotes, "TODOS", "").size());
        assertEquals(4, FiltroLotes.aplicar(lotes, null, null).size());
    }

    @Test
    void filtraPorEstado() {
        assertEquals(1, FiltroLotes.aplicar(lotes, "SOBRECARGA", "").size());
        assertEquals(1, FiltroLotes.aplicar(lotes, "alerta", "").size());
        assertEquals(2, FiltroLotes.aplicar(lotes, "NORMAL", "").size());
    }

    @Test
    void filtraPorTextoEnNombreOEnPastura() {
        List<CargaLote> resultado = FiltroLotes.aplicar(lotes, "TODOS", "kikuyo");
        assertEquals(1, resultado.size());
        assertEquals(1, resultado.get(0).getLote().getIdLote());

        // "kikuy" aparece en la pastura del lote 1 y en el nombre del lote 4
        assertEquals(2, FiltroLotes.aplicar(lotes, "TODOS", "  KIKUY ").size());
    }

    @Test
    void combinaEstadoYTexto() {
        assertEquals(1, FiltroLotes.aplicar(lotes, "NORMAL", "kikuy").size());
        assertEquals(0, FiltroLotes.aplicar(lotes, "SOBRECARGA", "kikuy").size());
    }

    @Test
    void unEstadoDesconocidoNoRestringe() {
        assertEquals(4, FiltroLotes.aplicar(lotes, "INEXISTENTE", "").size());
    }

    @Test
    void cuentaLosLotesPorEstado() {
        assertEquals(2, FiltroLotes.contar(lotes, EstadoCarga.NORMAL));
        assertEquals(1, FiltroLotes.contar(lotes, EstadoCarga.ALERTA));
        assertEquals(1, FiltroLotes.contar(lotes, EstadoCarga.SOBRECARGA));
    }
}
