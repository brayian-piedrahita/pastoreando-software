package co.pastoreando.app.datos;

import co.pastoreando.app.dominio.CalculadoraCostos;
import co.pastoreando.app.modelo.EntradaCosto;
import co.pastoreando.app.modelo.ResultadoCosto;

/**
 * Calculo de costos por unidad ganadera (RF01 y RF02). El calculo oficial lo hace el servidor,
 * que ademas lo guarda en el historial; si no hay conexion, la app aplica las mismas reglas con
 * {@link CalculadoraCostos} y marca el resultado como calculado en el telefono.
 */
public final class RepositorioCostos {

    private final ServicioHttp http;
    private final CalculadoraCostos respaldoLocal;

    public RepositorioCostos(ServicioHttp http, CalculadoraCostos respaldoLocal) {
        this.http = http;
        this.respaldoLocal = respaldoLocal;
    }

    public ResultadoCosto calcular(String token, EntradaCosto entrada) throws ErrorApi {
        try {
            // Sin reintento automatico: repetir el POST duplicaria el calculo en el historial.
            RespuestaHttp respuesta = http.post(
                    "/costos/calcular", ConversorJson.cuerpoCosto(entrada), token, false);
            return ConversorJson.costo(respuesta.getCuerpo());
        } catch (ErrorApi error) {
            if (error.esDeConexion()) {
                return respaldoLocal.calcular(entrada);
            }
            throw error;
        }
    }
}
