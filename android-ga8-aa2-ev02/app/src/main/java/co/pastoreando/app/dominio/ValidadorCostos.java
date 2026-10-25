package co.pastoreando.app.dominio;

import java.util.EnumMap;
import java.util.Map;

import co.pastoreando.app.modelo.EntradaCosto;

/**
 * Valida y convierte los textos del formulario de costos antes de llamar al servidor.
 * Reglas: cada rubro es mayor o igual a cero (vacio cuenta como cero), al menos un rubro es
 * mayor a cero y la cantidad de animales es un entero mayor a cero.
 */
public final class ValidadorCostos {

    public ResultadoValidacion validar(String alimentacion, String mantenimiento, String servicios,
                                       String impuestos, String animales, String proposito) {
        Map<CampoCosto, ErrorValidacion> errores = new EnumMap<>(CampoCosto.class);

        double a = leerRubro(alimentacion, CampoCosto.ALIMENTACION, errores);
        double m = leerRubro(mantenimiento, CampoCosto.MANTENIMIENTO, errores);
        double s = leerRubro(servicios, CampoCosto.SERVICIOS, errores);
        double i = leerRubro(impuestos, CampoCosto.IMPUESTOS, errores);
        int n = leerAnimales(animales, errores);

        boolean rubrosCorrectos = !errores.containsKey(CampoCosto.ALIMENTACION)
                && !errores.containsKey(CampoCosto.MANTENIMIENTO)
                && !errores.containsKey(CampoCosto.SERVICIOS)
                && !errores.containsKey(CampoCosto.IMPUESTOS);
        if (rubrosCorrectos && a + m + s + i <= 0) {
            errores.put(CampoCosto.ALIMENTACION, ErrorValidacion.SIN_RUBROS);
        }

        EntradaCosto entrada = errores.isEmpty() ? new EntradaCosto(a, m, s, i, n, proposito) : null;
        return new ResultadoValidacion(errores, entrada);
    }

    private static double leerRubro(String texto, CampoCosto campo,
                                    Map<CampoCosto, ErrorValidacion> errores) {
        String limpio = texto == null ? "" : texto.trim();
        if (limpio.isEmpty()) {
            return 0.0;
        }
        double valor;
        try {
            valor = Double.parseDouble(limpio);
        } catch (NumberFormatException e) {
            errores.put(campo, ErrorValidacion.NO_NUMERICO);
            return 0.0;
        }
        if (Double.isNaN(valor) || Double.isInfinite(valor)) {
            errores.put(campo, ErrorValidacion.NO_NUMERICO);
            return 0.0;
        }
        if (valor < 0) {
            errores.put(campo, ErrorValidacion.NEGATIVO);
            return 0.0;
        }
        return valor;
    }

    private static int leerAnimales(String texto, Map<CampoCosto, ErrorValidacion> errores) {
        String limpio = texto == null ? "" : texto.trim();
        if (limpio.isEmpty()) {
            errores.put(CampoCosto.ANIMALES, ErrorValidacion.VACIO);
            return 0;
        }
        int valor;
        try {
            valor = Integer.parseInt(limpio);
        } catch (NumberFormatException e) {
            errores.put(CampoCosto.ANIMALES, ErrorValidacion.NO_ENTERO);
            return 0;
        }
        if (valor <= 0) {
            errores.put(CampoCosto.ANIMALES, ErrorValidacion.DEBE_SER_POSITIVO);
            return 0;
        }
        return valor;
    }
}
