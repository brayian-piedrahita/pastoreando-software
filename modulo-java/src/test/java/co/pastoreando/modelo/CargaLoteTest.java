package co.pastoreando.modelo;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CargaLoteTest {

    private static Lote loteConCapacidad(int capacidad) {
        return new Lote(1, 1, "Lote 01", new BigDecimal("20.00"), capacidad, "Kikuyo");
    }

    @ParameterizedTest(name = "{0} de 40 cabezas -> {1}")
    @CsvSource({
            "0,  NORMAL",
            "32, NORMAL",      // 80 % exacto: todavia normal
            "33, ALERTA",      // primer valor sobre el 80 %
            "38, ALERTA",      // caso del prototipo: 95 %
            "40, ALERTA",      // 100 % exacto: lleno pero sin exceso
            "41, SOBRECARGA",  // primer valor sobre el 100 %
            "60, SOBRECARGA"
    })
    void clasificaElEstadoEnLosLimites(int cabezas, EstadoCarga esperado) {
        assertEquals(esperado, new CargaLote(loteConCapacidad(40), cabezas).getEstado());
    }

    @Test
    void calculaElPorcentajeDeOcupacion() {
        assertEquals(95.0, new CargaLote(loteConCapacidad(40), 38).getPorcentajeOcupacion(), 0.0001);
        assertEquals(120.0, new CargaLote(loteConCapacidad(20), 24).getPorcentajeOcupacion(), 0.0001);
    }

    @Test
    void calculaCupoYExcedente() {
        CargaLote conCupo = new CargaLote(loteConCapacidad(40), 38);
        assertEquals(2, conCupo.getCupoDisponible());
        assertEquals(0, conCupo.getCabezasExcedentes());

        CargaLote sobrecargado = new CargaLote(loteConCapacidad(20), 24);
        assertEquals(0, sobrecargado.getCupoDisponible());
        assertEquals(4, sobrecargado.getCabezasExcedentes());
    }

    @Test
    void rechazaDatosInconsistentes() {
        assertThrows(IllegalArgumentException.class, () -> new CargaLote(null, 5));
        assertThrows(IllegalArgumentException.class, () -> new CargaLote(loteConCapacidad(0), 5));
        assertThrows(IllegalArgumentException.class, () -> new CargaLote(loteConCapacidad(40), -1));
    }
}
