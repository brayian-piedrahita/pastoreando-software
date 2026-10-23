package co.pastoreando.controlador;

import co.pastoreando.excepcion.ValidacionException;
import co.pastoreando.modelo.Lote;

import java.math.BigDecimal;
import java.util.regex.Pattern;

/**
 * Reglas de validacion de los datos de un lote. Reciben los valores como texto
 * (tal cual llegan de la consola o de un formulario) y devuelven el dato ya
 * convertido o lanzan {@link ValidacionException} indicando el campo.
 *
 * <p>Son las mismas reglas del dominio de la version Python: nombre de 3 a 50
 * caracteres sin simbolos, hectareas y capacidad mayores que cero y tipo de
 * pastura obligatorio. Los limites de longitud y de decimales coinciden con las
 * columnas de la tabla LOTES.</p>
 */
public final class ValidadorLote {

    public static final int NOMBRE_MINIMO = 3;
    public static final int NOMBRE_MAXIMO = 50;
    public static final int PASTURA_MAXIMO = 50;

    /** Hectareas maximas que admite la columna DECIMAL(8,2). */
    private static final BigDecimal HECTAREAS_MAXIMAS = new BigDecimal("999999.99");

    /** Decimales que admite la columna hectareas. */
    private static final int HECTAREAS_DECIMALES = 2;

    /** Solo letras (incluidas las acentuadas y la enie), digitos y espacios. */
    private static final Pattern PATRON_TEXTO = Pattern.compile("[\\p{L}\\p{N} ]+");

    private ValidadorLote() {
    }

    /** Valida los cuatro datos editables y arma el lote (sin id). */
    public static Lote validar(int idPropietario, String nombreLote, String hectareas,
                               String capacidadCarga, String tipoPastura) {
        Lote lote = new Lote();
        lote.setIdPropietario(idPropietario);
        lote.setNombreLote(validarNombre(nombreLote));
        lote.setHectareas(validarHectareas(hectareas));
        lote.setCapacidadCarga(validarCapacidad(capacidadCarga));
        lote.setTipoPastura(validarTipoPastura(tipoPastura));
        return lote;
    }

    public static String validarNombre(String valor) {
        String nombre = valor == null ? "" : valor.trim();
        if (nombre.isEmpty()) {
            throw new ValidacionException("nombreLote", "El nombre del lote es obligatorio.");
        }
        if (nombre.length() < NOMBRE_MINIMO || nombre.length() > NOMBRE_MAXIMO) {
            throw new ValidacionException("nombreLote", "El nombre del lote debe tener entre "
                    + NOMBRE_MINIMO + " y " + NOMBRE_MAXIMO + " caracteres.");
        }
        if (!PATRON_TEXTO.matcher(nombre).matches()) {
            throw new ValidacionException("nombreLote",
                    "El nombre del lote solo admite letras, numeros y espacios.");
        }
        return nombre;
    }

    public static BigDecimal validarHectareas(String valor) {
        String texto = valor == null ? "" : valor.trim().replace(',', '.');
        if (texto.isEmpty()) {
            throw new ValidacionException("hectareas", "Las hectareas son obligatorias.");
        }
        BigDecimal hectareas;
        try {
            hectareas = new BigDecimal(texto);
        } catch (NumberFormatException e) {
            throw new ValidacionException("hectareas", "Las hectareas deben ser un numero.");
        }
        if (hectareas.signum() <= 0) {
            throw new ValidacionException("hectareas", "Las hectareas deben ser mayores que cero.");
        }
        if (hectareas.stripTrailingZeros().scale() > HECTAREAS_DECIMALES) {
            throw new ValidacionException("hectareas",
                    "Las hectareas admiten maximo " + HECTAREAS_DECIMALES + " decimales.");
        }
        if (hectareas.compareTo(HECTAREAS_MAXIMAS) > 0) {
            throw new ValidacionException("hectareas",
                    "Las hectareas no pueden superar " + HECTAREAS_MAXIMAS.toPlainString() + ".");
        }
        return hectareas.setScale(HECTAREAS_DECIMALES);
    }

    public static int validarCapacidad(String valor) {
        String texto = valor == null ? "" : valor.trim();
        if (texto.isEmpty()) {
            throw new ValidacionException("capacidadCarga",
                    "La capacidad de carga es obligatoria.");
        }
        int capacidad;
        try {
            capacidad = Integer.parseInt(texto);
        } catch (NumberFormatException e) {
            throw new ValidacionException("capacidadCarga",
                    "La capacidad de carga debe ser un numero entero de cabezas.");
        }
        if (capacidad <= 0) {
            throw new ValidacionException("capacidadCarga",
                    "La capacidad de carga debe ser mayor que cero.");
        }
        return capacidad;
    }

    public static String validarTipoPastura(String valor) {
        String pastura = valor == null ? "" : valor.trim();
        if (pastura.isEmpty()) {
            throw new ValidacionException("tipoPastura", "El tipo de pastura es obligatorio.");
        }
        if (pastura.length() > PASTURA_MAXIMO) {
            throw new ValidacionException("tipoPastura", "El tipo de pastura no puede superar "
                    + PASTURA_MAXIMO + " caracteres.");
        }
        if (!PATRON_TEXTO.matcher(pastura).matches()) {
            throw new ValidacionException("tipoPastura",
                    "El tipo de pastura solo admite letras, numeros y espacios.");
        }
        return pastura;
    }

    /** Convierte un identificador recibido como texto en un entero positivo. */
    public static int validarId(String campo, String valor) {
        String texto = valor == null ? "" : valor.trim();
        try {
            int id = Integer.parseInt(texto);
            if (id > 0) {
                return id;
            }
        } catch (NumberFormatException e) {
            // se informa abajo con el mismo mensaje
        }
        throw new ValidacionException(campo, "El identificador debe ser un numero entero positivo.");
    }
}
