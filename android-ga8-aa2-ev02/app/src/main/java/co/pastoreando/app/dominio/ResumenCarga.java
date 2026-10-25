package co.pastoreando.app.dominio;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import co.pastoreando.app.modelo.Lote;
import co.pastoreando.app.modelo.NivelCarga;

/** Conteo de lotes por nivel del semaforo, para el resumen de la pantalla de lotes (RF04). */
public final class ResumenCarga {

    private final Map<NivelCarga, Integer> conteo = new EnumMap<>(NivelCarga.class);

    private ResumenCarga() {
        for (NivelCarga nivel : NivelCarga.values()) {
            conteo.put(nivel, 0);
        }
    }

    public static ResumenCarga de(List<Lote> lotes) {
        ResumenCarga resumen = new ResumenCarga();
        for (Lote lote : lotes) {
            if (lote.getEstado() != null) {
                NivelCarga nivel = lote.getEstado().getNivel();
                resumen.conteo.put(nivel, resumen.conteo.get(nivel) + 1);
            }
        }
        return resumen;
    }

    public int cantidad(NivelCarga nivel) {
        return conteo.get(nivel);
    }

    public int total() {
        int suma = 0;
        for (int valor : conteo.values()) {
            suma += valor;
        }
        return suma;
    }

    /** True si algun lote requiere atencion: en alerta o en sobrecarga. */
    public boolean requiereAtencion() {
        return cantidad(NivelCarga.ALERTA) > 0 || cantidad(NivelCarga.SOBRECARGA) > 0;
    }
}
