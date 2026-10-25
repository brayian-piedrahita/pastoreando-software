package co.pastoreando.app.dominio;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

import co.pastoreando.app.modelo.EstadoCarga;
import co.pastoreando.app.modelo.Lote;
import co.pastoreando.app.modelo.NivelCarga;

/** Conteo de lotes por color del semaforo. */
public class ResumenCargaTest {

    private static Lote lote(int id, int carga, int capacidad) {
        double porcentaje = carga * 100.0 / capacidad;
        EstadoCarga estado = new EstadoCarga(carga, capacidad, porcentaje,
                NivelCarga.desdePorcentaje(porcentaje), "", 0, "");
        return new Lote(id, "Lote " + id, 10, capacidad, "Kikuyo", estado);
    }

    @Test
    public void cuenta_los_cuatro_lotes_de_prueba_del_proyecto() {
        List<Lote> lotes = new ArrayList<>();
        lotes.add(lote(1, 26, 30));   // La Esperanza: alerta
        lotes.add(lote(2, 24, 20));   // Alto El Mirador: sobrecarga
        lotes.add(lote(3, 48, 50));   // Las Acacias: alerta
        lotes.add(lote(4, 0, 12));    // Rio Frio: normal

        ResumenCarga resumen = ResumenCarga.de(lotes);

        assertEquals(1, resumen.cantidad(NivelCarga.NORMAL));
        assertEquals(2, resumen.cantidad(NivelCarga.ALERTA));
        assertEquals(1, resumen.cantidad(NivelCarga.SOBRECARGA));
        assertEquals(4, resumen.total());
        assertTrue(resumen.requiereAtencion());
    }

    @Test
    public void sin_lotes_todo_queda_en_cero() {
        ResumenCarga resumen = ResumenCarga.de(new ArrayList<Lote>());
        assertEquals(0, resumen.total());
        assertFalse(resumen.requiereAtencion());
    }

    @Test
    public void solo_lotes_normales_no_requieren_atencion() {
        List<Lote> lotes = new ArrayList<>();
        lotes.add(lote(1, 5, 30));
        assertFalse(ResumenCarga.de(lotes).requiereAtencion());
    }
}
