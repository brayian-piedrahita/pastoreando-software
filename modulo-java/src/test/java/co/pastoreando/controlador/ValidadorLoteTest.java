package co.pastoreando.controlador;

import co.pastoreando.excepcion.ValidacionException;
import co.pastoreando.modelo.Lote;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ValidadorLoteTest {

    private static String campoDelError(Runnable accion) {
        return assertThrows(ValidacionException.class, accion::run).getCampo();
    }

    @Test
    void aceptaUnLoteValidoYNormalizaLosDatos() {
        Lote lote = ValidadorLote.validar(1, "  Lote \u00D1and\u00FA 2  ", "12,5", " 30 ", " Kikuyo ");

        assertEquals(1, lote.getIdPropietario());
        assertEquals("Lote \u00D1and\u00FA 2", lote.getNombreLote());
        assertEquals(new BigDecimal("12.50"), lote.getHectareas());
        assertEquals(30, lote.getCapacidadCarga());
        assertEquals("Kikuyo", lote.getTipoPastura());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "ab", "Lote@01", "Lote-01", "Lote_01"})
    void rechazaNombresInvalidos(String nombre) {
        assertEquals("nombreLote", campoDelError(() -> ValidadorLote.validarNombre(nombre)));
    }

    @Test
    void rechazaNombresMuyLargos() {
        assertEquals("nombreLote", campoDelError(() -> ValidadorLote.validarNombre("a".repeat(51))));
    }

    @Test
    void aceptaNombresEnLosLimitesDeLongitud() {
        assertEquals("abc", ValidadorLote.validarNombre("abc"));
        assertEquals(50, ValidadorLote.validarNombre("a".repeat(50)).length());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"abc", "0", "-3", "0,00", "1,234", "1000000", "NaN"})
    void rechazaHectareasInvalidas(String hectareas) {
        assertEquals("hectareas", campoDelError(() -> ValidadorLote.validarHectareas(hectareas)));
    }

    @Test
    void aceptaHectareasConPuntoComaOEnteras() {
        assertEquals(new BigDecimal("15.50"), ValidadorLote.validarHectareas("15.5"));
        assertEquals(new BigDecimal("15.50"), ValidadorLote.validarHectareas("15,5"));
        assertEquals(new BigDecimal("8.00"), ValidadorLote.validarHectareas("8"));
        assertEquals(new BigDecimal("999999.99"), ValidadorLote.validarHectareas("999999.99"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"abc", "0", "-1", "2.5", "99999999999"})
    void rechazaCapacidadesInvalidas(String capacidad) {
        assertEquals("capacidadCarga", campoDelError(() -> ValidadorLote.validarCapacidad(capacidad)));
    }

    @Test
    void aceptaUnaCapacidadPositiva() {
        assertEquals(40, ValidadorLote.validarCapacidad("40"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "Kikuyo!", "Pasto/Elefante"})
    void rechazaTiposDePasturaInvalidos(String pastura) {
        assertEquals("tipoPastura", campoDelError(() -> ValidadorLote.validarTipoPastura(pastura)));
    }

    @Test
    void rechazaUnaPasturaMuyLarga() {
        assertEquals("tipoPastura",
                campoDelError(() -> ValidadorLote.validarTipoPastura("a".repeat(51))));
    }

    @Test
    void validaIdentificadores() {
        assertEquals(7, ValidadorLote.validarId("idLote", " 7 "));
        assertEquals("idLote", campoDelError(() -> ValidadorLote.validarId("idLote", "0")));
        assertEquals("idLote", campoDelError(() -> ValidadorLote.validarId("idLote", "-2")));
        assertEquals("idLote", campoDelError(() -> ValidadorLote.validarId("idLote", "x")));
        assertEquals("idLote", campoDelError(() -> ValidadorLote.validarId("idLote", null)));
    }

    @Test
    void elPrimerCampoInvalidoDefineElError() {
        assertEquals("nombreLote", campoDelError(() -> ValidadorLote.validar(1, "", "0", "0", "")));
        assertEquals("hectareas", campoDelError(() -> ValidadorLote.validar(1, "Lote 01", "0", "0", "")));
        assertEquals("capacidadCarga", campoDelError(() -> ValidadorLote.validar(1, "Lote 01", "5", "0", "")));
        assertEquals("tipoPastura", campoDelError(() -> ValidadorLote.validar(1, "Lote 01", "5", "10", "")));
    }
}
