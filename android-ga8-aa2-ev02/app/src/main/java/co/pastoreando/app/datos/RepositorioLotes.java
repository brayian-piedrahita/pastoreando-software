package co.pastoreando.app.datos;

import java.util.List;

import co.pastoreando.app.modelo.Lote;

/**
 * Consulta de lotes con su estado de carga (RF04). Guarda la ultima respuesta correcta de cada
 * usuario para poder mostrarla cuando el telefono pierde la conexion en el campo (RNF01).
 */
public final class RepositorioLotes {

    private static final String PREFIJO_CLAVE = "lotes_";

    private final ServicioHttp http;
    private final AlmacenCache cache;

    public RepositorioLotes(ServicioHttp http, AlmacenCache cache) {
        this.http = http;
        this.cache = cache;
    }

    /**
     * Trae los lotes del servidor. Si falla la conexion y hay una copia guardada, la devuelve
     * marcada como copia local; si no hay copia, propaga el error.
     */
    public ListaLotes listar(String token, int idUsuario) throws ErrorApi {
        String clave = PREFIJO_CLAVE + idUsuario;
        try {
            RespuestaHttp respuesta = http.get("/lotes", token);
            List<Lote> lotes = ConversorJson.lotes(respuesta.getCuerpo());
            cache.guardar(clave, respuesta.getCuerpo());
            return new ListaLotes(lotes, false);
        } catch (ErrorApi error) {
            if (error.esDeConexion()) {
                ListaLotes copia = copiaLocal(clave);
                if (copia != null) {
                    return copia;
                }
            }
            throw error;
        }
    }

    private ListaLotes copiaLocal(String clave) {
        String guardado = cache.leer(clave);
        if (guardado == null) {
            return null;
        }
        try {
            return new ListaLotes(ConversorJson.lotes(guardado), true);
        } catch (ErrorApi copiaDanada) {
            return null;
        }
    }
}
