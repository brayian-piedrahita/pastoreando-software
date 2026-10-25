package co.pastoreando.app.datos;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;


/**
 * Servidor HTTP minimo para probar el cliente sin red real. Atiende en el puerto que asigna el
 * sistema, responde en orden las respuestas programadas y guarda cada peticion recibida.
 */
final class ServidorSimulado implements AutoCloseable {

    /** Respuesta programada. Un estado 0 cierra la conexion sin contestar. */
    static final class Respuesta {
        final int estado;
        final String cuerpo;
        final long demoraMs;

        Respuesta(int estado, String cuerpo, long demoraMs) {
            this.estado = estado;
            this.cuerpo = cuerpo;
            this.demoraMs = demoraMs;
        }
    }

    /** Peticion tal como la recibio el servidor. */
    static final class Peticion {
        final String metodo;
        final String ruta;
        final Map<String, String> cabeceras;
        final String cuerpo;

        Peticion(String metodo, String ruta, Map<String, String> cabeceras, String cuerpo) {
            this.metodo = metodo;
            this.ruta = ruta;
            this.cabeceras = cabeceras;
            this.cuerpo = cuerpo;
        }
    }

    private final ServerSocket socket;
    private final Queue<Respuesta> programadas = new ConcurrentLinkedQueue<>();
    private final List<Peticion> recibidas = Collections.synchronizedList(new ArrayList<Peticion>());
    private final Thread hilo;
    private volatile boolean activo = true;

    ServidorSimulado() throws IOException {
        socket = new ServerSocket(0, 10, InetAddress.getLoopbackAddress());
        hilo = new Thread(this::atender, "servidor-simulado");
        hilo.setDaemon(true);
        hilo.start();
    }

    String urlBase() {
        return "http://127.0.0.1:" + socket.getLocalPort();
    }

    int puerto() {
        return socket.getLocalPort();
    }

    ServidorSimulado responder(int estado, String cuerpo) {
        programadas.add(new Respuesta(estado, cuerpo, 0));
        return this;
    }

    ServidorSimulado responderConDemora(int estado, String cuerpo, long demoraMs) {
        programadas.add(new Respuesta(estado, cuerpo, demoraMs));
        return this;
    }

    ServidorSimulado cerrarSinResponder() {
        programadas.add(new Respuesta(0, "", 0));
        return this;
    }

    List<Peticion> peticiones() {
        synchronized (recibidas) {
            return new ArrayList<>(recibidas);
        }
    }

    private void atender() {
        while (activo) {
            try {
                Socket cliente = socket.accept();
                // Cada conexion en su propio hilo: una respuesta demorada no bloquea a las demas.
                Thread conexion = new Thread(() -> atenderConexion(cliente), "conexion-simulada");
                conexion.setDaemon(true);
                conexion.start();
            } catch (IOException e) {
                // El servidor se cerro: el ciclo termina porque activo pasa a false.
            }
        }
    }

    private void atenderConexion(Socket cliente) {
        try (Socket abierto = cliente) {
            Peticion peticion = leer(abierto.getInputStream());
            if (peticion == null) {
                return;
            }
            Respuesta respuesta;
            synchronized (this) {
                recibidas.add(peticion);
                respuesta = programadas.poll();
            }
            if (respuesta == null) {
                respuesta = new Respuesta(500, "{}", 0);
            }
            if (respuesta.estado == 0) {
                return; // se cierra el socket sin contestar
            }
            if (respuesta.demoraMs > 0) {
                Thread.sleep(respuesta.demoraMs);
            }
            escribir(abierto.getOutputStream(), respuesta);
        } catch (IOException | InterruptedException e) {
            // El cliente corto la conexion: no hay nada que responder.
        }
    }

    private static Peticion leer(InputStream entrada) throws IOException {
        ByteArrayOutputStream cabecera = new ByteArrayOutputStream();
        final String delimitador = "\r\n\r\n";
        int vistos = 0; // caracteres del delimitador que ya se leyeron seguidos
        int actual;
        while ((actual = entrada.read()) != -1) {
            cabecera.write(actual);
            if (actual == delimitador.charAt(vistos)) {
                vistos++;
                if (vistos == delimitador.length()) {
                    break;
                }
            } else {
                vistos = actual == '\r' ? 1 : 0;
            }
        }
        if (cabecera.size() == 0) {
            return null;
        }
        String[] lineas = new String(cabecera.toByteArray(), StandardCharsets.ISO_8859_1).split("\r\n");
        String[] primera = lineas[0].split(" ");
        Map<String, String> cabeceras = new HashMap<>();
        for (int i = 1; i < lineas.length; i++) {
            int separador = lineas[i].indexOf(':');
            if (separador > 0) {
                cabeceras.put(lineas[i].substring(0, separador).trim().toLowerCase(Locale.ROOT),
                        lineas[i].substring(separador + 1).trim());
            }
        }
        int largo = cabeceras.containsKey("content-length") ? Integer.parseInt(cabeceras.get("content-length")) : 0;
        byte[] cuerpo = new byte[largo];
        int leidos = 0;
        while (leidos < largo) {
            int n = entrada.read(cuerpo, leidos, largo - leidos);
            if (n == -1) {
                break;
            }
            leidos += n;
        }
        return new Peticion(primera[0], primera.length > 1 ? primera[1] : "", cabeceras,
                new String(cuerpo, 0, leidos, StandardCharsets.UTF_8));
    }

    private static void escribir(OutputStream salida, Respuesta respuesta) throws IOException {
        byte[] cuerpo = respuesta.cuerpo.getBytes(StandardCharsets.UTF_8);
        String cabecera = "HTTP/1.1 " + respuesta.estado + " X\r\n"
                + "Content-Type: application/json; charset=utf-8\r\n"
                + "Content-Length: " + cuerpo.length + "\r\n"
                + "Connection: close\r\n\r\n";
        salida.write(cabecera.getBytes(StandardCharsets.ISO_8859_1));
        salida.write(cuerpo);
        salida.flush();
    }

    @Override
    public void close() throws IOException {
        activo = false;
        socket.close();
    }
}
