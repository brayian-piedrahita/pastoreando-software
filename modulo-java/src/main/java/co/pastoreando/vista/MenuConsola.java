package co.pastoreando.vista;

import co.pastoreando.controlador.LoteControlador;
import co.pastoreando.controlador.ValidadorLote;
import co.pastoreando.excepcion.AccesoDatosException;
import co.pastoreando.excepcion.ReglaNegocioException;
import co.pastoreando.excepcion.ValidacionException;
import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.EstadoCarga;
import co.pastoreando.modelo.Lote;

import java.io.PrintStream;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Scanner;

/**
 * Vista de consola del modulo de lotes. Solo lee y muestra: toda validacion y
 * regla de negocio vive en el controlador.
 */
public class MenuConsola {

    private static final Locale LOCALE_COLOMBIA = Locale.forLanguageTag("es-CO");
    private static final int ANCHO_BARRA = 20;
    private static final int ANCHO_NOMBRE = 22;

    private final LoteControlador controlador;
    private final Scanner entrada;
    private final PrintStream salida;
    private int idPropietario;

    public MenuConsola(LoteControlador controlador, Scanner entrada, PrintStream salida) {
        this.controlador = controlador;
        this.entrada = entrada;
        this.salida = salida;
    }

    /** Pide el propietario y atiende el menu hasta que el usuario elige salir. */
    public void iniciar() {
        salida.println("=== PASTOREANDO | Gestion de lotes ===");
        try {
            if (!identificarPropietario()) {
                return;
            }
            boolean continuar = true;
            while (continuar) {
                mostrarMenu();
                continuar = ejecutarOpcion(leerTexto("Seleccione una opcion: "));
            }
        } catch (NoSuchElementException e) {
            salida.println("Entrada finalizada. Hasta pronto.");
        }
    }

    private boolean identificarPropietario() {
        try {
            idPropietario = ValidadorLote.validarId("idPropietario",
                    leerTexto("Identificador del propietario: "));
            controlador.verificarPropietario(idPropietario);
            salida.println("Sesion iniciada con el propietario " + idPropietario + ".");
            return true;
        } catch (ValidacionException | ReglaNegocioException e) {
            salida.println("ERROR: " + e.getMessage());
            return false;
        } catch (AccesoDatosException e) {
            salida.println("ERROR de base de datos: " + e.getMessage());
            return false;
        }
    }

    private void mostrarMenu() {
        salida.println();
        salida.println("--- Menu de lotes (propietario " + idPropietario + ") ---");
        salida.println("1. Registrar lote");
        salida.println("2. Listar mis lotes con su carga");
        salida.println("3. Monitorear un lote");
        salida.println("4. Actualizar un lote");
        salida.println("5. Eliminar un lote");
        salida.println("0. Salir");
    }

    /** Ejecuta la opcion elegida; devuelve false cuando se pide salir. */
    private boolean ejecutarOpcion(String opcion) {
        try {
            switch (opcion.trim()) {
                case "1" -> registrarLote();
                case "2" -> listarLotes();
                case "3" -> monitorearLote();
                case "4" -> actualizarLote();
                case "5" -> eliminarLote();
                case "0" -> {
                    salida.println("Hasta pronto.");
                    return false;
                }
                default -> salida.println("Opcion no valida. Elija un numero del menu.");
            }
        } catch (ValidacionException e) {
            salida.println("ERROR en " + e.getCampo() + ": " + e.getMessage());
        } catch (ReglaNegocioException e) {
            salida.println("AVISO: " + e.getMessage());
        } catch (AccesoDatosException e) {
            salida.println("ERROR de base de datos: " + e.getMessage());
        }
        return true;
    }

    private void registrarLote() {
        salida.println("-- Registrar lote --");
        String nombre = leerTexto("Nombre del lote: ");
        String hectareas = leerTexto("Hectareas: ");
        String capacidad = leerTexto("Capacidad de carga (cabezas): ");
        String pastura = leerTexto("Tipo de pastura: ");
        CargaLote carga = controlador.registrarLote(idPropietario, nombre, hectareas, capacidad, pastura);
        salida.println("OK: lote registrado con el identificador " + carga.getLote().getIdLote() + ".");
        mostrarMonitoreo(carga);
    }

    private void listarLotes() {
        List<CargaLote> lotes = controlador.listarLotes(idPropietario);
        if (lotes.isEmpty()) {
            salida.println("El propietario " + idPropietario + " todavia no tiene lotes registrados.");
            return;
        }
        salida.println(String.format(LOCALE_COLOMBIA, "%-4s %-" + ANCHO_NOMBRE + "s %9s %9s %7s %10s  %s",
                "ID", "LOTE", "HECTAREAS", "CAPACIDAD", "ACTUAL", "OCUPACION", "ESTADO"));
        for (CargaLote carga : lotes) {
            Lote lote = carga.getLote();
            salida.println(String.format(LOCALE_COLOMBIA, "%-4d %-" + ANCHO_NOMBRE + "s %9.2f %9d %7d %9.1f%%  %s",
                    lote.getIdLote(), recortar(lote.getNombreLote(), ANCHO_NOMBRE), lote.getHectareas(),
                    lote.getCapacidadCarga(), carga.getCabezasActuales(),
                    carga.getPorcentajeOcupacion(), carga.getEstado().getEtiqueta()));
        }
    }

    private void monitorearLote() {
        int idLote = leerId("Identificador del lote: ");
        mostrarMonitoreo(controlador.consultarLote(idLote, idPropietario));
    }

    private void actualizarLote() {
        int idLote = leerId("Identificador del lote a actualizar: ");
        Lote actual = controlador.consultarLote(idLote, idPropietario).getLote();
        salida.println("-- Actualizar " + actual.getNombreLote() + " (Enter conserva el valor actual) --");
        String nombre = leerConValorActual("Nombre del lote", actual.getNombreLote());
        String hectareas = leerConValorActual("Hectareas", actual.getHectareas().toPlainString());
        String capacidad = leerConValorActual("Capacidad de carga", String.valueOf(actual.getCapacidadCarga()));
        String pastura = leerConValorActual("Tipo de pastura", actual.getTipoPastura());
        CargaLote carga = controlador.actualizarLote(idLote, idPropietario, nombre, hectareas, capacidad, pastura);
        salida.println("OK: lote actualizado.");
        mostrarMonitoreo(carga);
    }

    private void eliminarLote() {
        int idLote = leerId("Identificador del lote a eliminar: ");
        Lote lote = controlador.consultarLote(idLote, idPropietario).getLote();
        String respuesta = leerTexto("Confirma eliminar '" + lote.getNombreLote() + "'? (s/n): ");
        if (!respuesta.trim().equalsIgnoreCase("s")) {
            salida.println("Operacion cancelada: el lote no se elimino.");
            return;
        }
        controlador.eliminarLote(idLote, idPropietario);
        salida.println("OK: lote eliminado.");
    }

    /** Muestra el monitoreo del lote: capacidad, carga actual, barra de ocupacion y estado. */
    private void mostrarMonitoreo(CargaLote carga) {
        Lote lote = carga.getLote();
        EstadoCarga estado = carga.getEstado();
        salida.println();
        salida.println("--- Monitoreo de " + lote.getNombreLote() + " ---");
        salida.println("Tipo de pastura : " + lote.getTipoPastura());
        salida.println(String.format(LOCALE_COLOMBIA, "Area            : %.2f ha", lote.getHectareas()));
        salida.println("Capacidad       : " + lote.getCapacidadCarga() + " cabezas");
        salida.println("Ganado actual   : " + carga.getCabezasActuales() + " cabezas (contratos activos)");
        salida.println(String.format(LOCALE_COLOMBIA, "Ocupacion       : %.1f %%  %s",
                carga.getPorcentajeOcupacion(), construirBarra(carga.getPorcentajeOcupacion())));
        salida.println("Estado          : " + estado.name());
        salida.println(">> " + estado.getMensaje());
        if (estado == EstadoCarga.SOBRECARGA) {
            salida.println(">> Exceso: " + carga.getCabezasExcedentes() + " cabezas por encima de la capacidad.");
        } else {
            salida.println(">> Cupo disponible: " + carga.getCupoDisponible() + " cabezas.");
        }
    }

    private String construirBarra(double porcentaje) {
        int llenas = (int) Math.min(ANCHO_BARRA, Math.round(porcentaje / 100.0 * ANCHO_BARRA));
        return "[" + "#".repeat(llenas) + ".".repeat(ANCHO_BARRA - llenas) + "]";
    }

    private String recortar(String texto, int maximo) {
        return texto.length() <= maximo ? texto : texto.substring(0, maximo - 1) + ".";
    }

    private int leerId(String mensaje) {
        return ValidadorLote.validarId("idLote", leerTexto(mensaje));
    }

    private String leerTexto(String mensaje) {
        salida.print(mensaje);
        salida.flush();
        return entrada.nextLine();
    }

    private String leerConValorActual(String campo, String actual) {
        String respuesta = leerTexto(campo + " [" + actual + "]: ");
        return respuesta.isBlank() ? actual : respuesta;
    }
}
