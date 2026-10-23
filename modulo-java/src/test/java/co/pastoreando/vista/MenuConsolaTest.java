package co.pastoreando.vista;

import co.pastoreando.apoyo.DAOEnMemoria;
import co.pastoreando.controlador.LoteControlador;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MenuConsolaTest {

    private DAOEnMemoria dao;

    @BeforeEach
    void preparar() {
        dao = new DAOEnMemoria();
        dao.agregarPropietario(1);
    }

    /** Ejecuta el menu con las lineas indicadas y devuelve todo lo que imprimio. */
    private String ejecutar(String... lineas) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        PrintStream salida = new PrintStream(bytes, true, StandardCharsets.UTF_8);
        Scanner entrada = new Scanner(String.join("\n", lineas) + "\n");
        new MenuConsola(new LoteControlador(dao), entrada, salida).iniciar();
        return bytes.toString(StandardCharsets.UTF_8);
    }

    @Test
    void rechazaUnUsuarioQueNoEsPropietario() {
        String texto = ejecutar("99");

        assertTrue(texto.contains("no existe o no tiene el rol de Propietario"));
        assertFalse(texto.contains("Menu de lotes"));
    }

    @Test
    void registraYMuestraElMonitoreoDelLote() {
        String texto = ejecutar("1", "1", "Lote 01", "20", "40", "Kikuyo", "2", "0");

        assertTrue(texto.contains("lote registrado con el identificador 1"));
        assertTrue(texto.contains("Monitoreo de Lote 01"));
        assertTrue(texto.contains("Estado          : NORMAL"));
        assertTrue(texto.contains("Lote 01"));
        assertTrue(texto.contains("Hasta pronto."));
    }

    @Test
    void avisaCuandoElLoteEstaEnAlerta() {
        ejecutar("1", "1", "Lote 01", "20", "40", "Kikuyo", "0");
        dao.simularContratos(1, 1, 38);

        String texto = ejecutar("1", "3", "1", "0");

        assertTrue(texto.contains("Ocupacion       : 95,0 %"));
        assertTrue(texto.contains("Estado          : ALERTA"));
        assertTrue(texto.contains("Cupo disponible: 2 cabezas."));
    }

    @Test
    void avisaCuandoElLoteEstaSobrecargado() {
        ejecutar("1", "1", "Lote 03", "8", "20", "Estrella Africana", "0");
        dao.simularContratos(1, 2, 24);

        String texto = ejecutar("1", "3", "1", "0");

        assertTrue(texto.contains("Estado          : SOBRECARGA"));
        assertTrue(texto.contains("Exceso: 4 cabezas"));
    }

    @Test
    void informaLosErroresDeValidacionYSigueFuncionando() {
        String texto = ejecutar("1", "1", "Lote 01", "cero", "40", "Kikuyo", "0");

        assertTrue(texto.contains("ERROR en hectareas: Las hectareas deben ser un numero."));
        assertTrue(texto.contains("Hasta pronto."));
    }

    @Test
    void noEliminaUnLoteConContratosAunqueSeConfirme() {
        ejecutar("1", "1", "Lote 02", "15", "30", "Brachiaria", "0");
        dao.simularContratos(1, 1, 12);

        String texto = ejecutar("1", "5", "1", "s", "0");

        assertTrue(texto.contains("AVISO: No se puede eliminar 'Lote 02'"));
    }

    @Test
    void cancelaLaEliminacionSiNoSeConfirma() {
        ejecutar("1", "1", "Lote 04", "12", "25", "Pasto Elefante", "0");

        String texto = ejecutar("1", "5", "1", "n", "0");

        assertTrue(texto.contains("Operacion cancelada"));
    }

    @Test
    void terminaSinErrorSiSeAcabaLaEntrada() {
        String texto = ejecutar("1");

        assertTrue(texto.contains("Entrada finalizada."));
    }
}
