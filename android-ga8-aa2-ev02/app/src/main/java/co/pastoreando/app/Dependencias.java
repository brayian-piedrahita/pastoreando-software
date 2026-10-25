package co.pastoreando.app;

import android.content.Context;

import co.pastoreando.app.almacen.CacheLocal;
import co.pastoreando.app.datos.ClienteApi;
import co.pastoreando.app.datos.RepositorioAutenticacion;
import co.pastoreando.app.datos.RepositorioCostos;
import co.pastoreando.app.datos.RepositorioLotes;
import co.pastoreando.app.dominio.CalculadoraCostos;

/**
 * Punto unico donde se arman los repositorios con sus colaboradores. Las pantallas piden aqui lo
 * que necesitan y no conocen el cliente HTTP ni el almacenamiento.
 */
public final class Dependencias {

    private Dependencias() {
    }

    public static RepositorioAutenticacion autenticacion() {
        return new RepositorioAutenticacion(ClienteApi.instancia());
    }

    public static RepositorioLotes lotes(Context contexto) {
        return new RepositorioLotes(ClienteApi.instancia(), new CacheLocal(contexto));
    }

    public static RepositorioCostos costos() {
        return new RepositorioCostos(ClienteApi.instancia(), new CalculadoraCostos());
    }
}
