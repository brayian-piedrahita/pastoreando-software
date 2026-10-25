package co.pastoreando.app.dominio;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/** Entrega la estrategia de costo que corresponde a cada proposito del ganado. */
public final class FabricaEstrategias {

    private static final List<EstrategiaCosto> TODAS = Collections.unmodifiableList(
            Arrays.<EstrategiaCosto>asList(
                    new EstrategiaCarne(),
                    new EstrategiaLeche(),
                    new EstrategiaDobleProposito()));

    private FabricaEstrategias() {
    }

    /** Las tres estrategias, en el orden en que se ofrecen en pantalla. */
    public static List<EstrategiaCosto> todas() {
        return TODAS;
    }

    /**
     * Busca la estrategia por el texto del proposito; ignora tildes, mayusculas y espacios.
     *
     * @throws IllegalArgumentException si el proposito no existe
     */
    public static EstrategiaCosto paraProposito(String proposito) {
        String buscado = normalizar(proposito);
        for (EstrategiaCosto estrategia : TODAS) {
            if (normalizar(estrategia.valorApi()).equals(buscado)) {
                return estrategia;
            }
        }
        throw new IllegalArgumentException("Proposito desconocido: " + proposito);
    }

    private static String normalizar(String texto) {
        if (texto == null) {
            return "";
        }
        return Normalizer.normalize(texto.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }
}
