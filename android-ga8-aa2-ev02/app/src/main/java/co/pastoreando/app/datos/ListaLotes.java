package co.pastoreando.app.datos;

import java.util.Collections;
import java.util.List;

import co.pastoreando.app.modelo.Lote;

/** Lotes para mostrar y su origen: el servidor o la ultima copia guardada en el telefono. */
public final class ListaLotes {

    private final List<Lote> lotes;
    private final boolean desdeCopiaLocal;

    public ListaLotes(List<Lote> lotes, boolean desdeCopiaLocal) {
        this.lotes = Collections.unmodifiableList(lotes);
        this.desdeCopiaLocal = desdeCopiaLocal;
    }

    public List<Lote> getLotes() {
        return lotes;
    }

    /** True cuando no hubo conexion y se muestran los ultimos datos recibidos. */
    public boolean isDesdeCopiaLocal() {
        return desdeCopiaLocal;
    }
}
