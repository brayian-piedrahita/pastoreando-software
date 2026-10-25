package co.pastoreando.app.ui;

import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.NumberFormat;
import java.util.Locale;

/** Formato de cifras para la pantalla con las convenciones de Colombia: punto de miles y coma decimal. */
public final class Formato {

    private static final Locale COLOMBIA = Locale.forLanguageTag("es-CO");

    private Formato() {
    }

    /** Pesos sin decimales, por ejemplo "$ 288.000". */
    public static String pesos(double valor) {
        NumberFormat formato = NumberFormat.getIntegerInstance(COLOMBIA);
        formato.setRoundingMode(RoundingMode.HALF_UP);
        return "$ " + formato.format(valor);
    }

    /** Porcentaje con un decimal, por ejemplo "86,7 %". */
    public static String porcentaje(double valor) {
        return decimal(valor, "0.0") + " %";
    }

    /** Factor con dos decimales, por ejemplo "1,10". */
    public static String factor(double valor) {
        return decimal(valor, "0.00");
    }

    /** Hectareas con hasta dos decimales, por ejemplo "12,5" o "10". */
    public static String hectareas(double valor) {
        return decimal(valor, "0.##");
    }

    private static String decimal(double valor, String patron) {
        DecimalFormat formato = new DecimalFormat(patron, DecimalFormatSymbols.getInstance(COLOMBIA));
        formato.setRoundingMode(RoundingMode.HALF_UP);
        return formato.format(valor);
    }

    /**
     * Clave estable de un rubro: minusculas y sin tildes. El servidor responde "Alimentaci\u00f3n"
     * y la app compara con "alimentacion", asi que ambas formas llegan a la misma etiqueta.
     */
    public static String claveRubro(String nombre) {
        if (nombre == null) {
            return "";
        }
        String sinTildes = java.text.Normalizer.normalize(nombre.trim(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(java.util.Locale.ROOT);
    }
}
