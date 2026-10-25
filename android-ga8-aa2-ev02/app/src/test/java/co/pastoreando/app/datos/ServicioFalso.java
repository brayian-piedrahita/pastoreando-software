package co.pastoreando.app.datos;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

/** Sustituto del servidor para probar los repositorios: entrega respuestas o errores en orden. */
final class ServicioFalso implements ServicioHttp {

    private final Queue<Object> programadas = new LinkedList<>();
    private final List<String> rutas = new ArrayList<>();
    private final List<String> cuerpos = new ArrayList<>();

    ServicioFalso responder(String cuerpo) {
        programadas.add(new RespuestaHttp(200, cuerpo));
        return this;
    }

    ServicioFalso fallar(ErrorApi.Tipo tipo, int codigo) {
        programadas.add(new ErrorApi(tipo, codigo, "", "", null));
        return this;
    }

    List<String> rutas() {
        return rutas;
    }

    List<String> cuerpos() {
        return cuerpos;
    }

    @Override
    public RespuestaHttp get(String ruta, String token) throws ErrorApi {
        rutas.add(ruta);
        cuerpos.add("");
        return siguiente();
    }

    @Override
    public RespuestaHttp post(String ruta, String cuerpoJson, String token, boolean reintentar)
            throws ErrorApi {
        rutas.add(ruta);
        cuerpos.add(cuerpoJson);
        return siguiente();
    }

    private RespuestaHttp siguiente() throws ErrorApi {
        Object accion = programadas.poll();
        if (accion instanceof ErrorApi) {
            throw (ErrorApi) accion;
        }
        return (RespuestaHttp) accion;
    }
}
