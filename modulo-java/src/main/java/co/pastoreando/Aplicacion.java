package co.pastoreando;

import co.pastoreando.controlador.LoteControlador;
import co.pastoreando.dao.ConexionBD;
import co.pastoreando.dao.LoteDAOJdbc;
import co.pastoreando.excepcion.AccesoDatosException;
import co.pastoreando.vista.MenuConsola;

import java.io.PrintStream;
import java.util.Scanner;

/**
 * Punto de entrada de la consola del modulo de lotes.
 *
 * <p>Ejecucion desde la carpeta del modulo: {@code mvn -q compile exec:java}</p>
 */
public final class Aplicacion {

    private Aplicacion() {
    }

    public static void main(String[] args) {
        // Los mensajes van sin tildes: la consola de Windows y la salida de Java no
        // siempre usan la misma codificacion de caracteres.
        PrintStream salida = System.out;
        Scanner entrada = new Scanner(System.in);

        try {
            ConexionBD conexionBD = ConexionBD.getInstancia();
            conexionBD.probarConexion();
            salida.println("Conexion con MySQL establecida.");

            LoteControlador controlador = new LoteControlador(new LoteDAOJdbc(conexionBD));
            new MenuConsola(controlador, entrada, salida).iniciar();
        } catch (AccesoDatosException e) {
            salida.println("ERROR: " + e.getMessage());
            System.exit(1);
        }
    }
}
