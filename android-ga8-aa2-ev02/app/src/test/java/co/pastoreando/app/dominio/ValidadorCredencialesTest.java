package co.pastoreando.app.dominio;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

/** Validaciones del inicio de sesion que evitan una llamada innecesaria al servidor. */
public class ValidadorCredencialesTest {

    @Test
    public void un_correo_con_formato_correcto_pasa() {
        assertNull(ValidadorCredenciales.validarCorreo("carlos.ramirez@pastoreando.co"));
        assertNull(ValidadorCredenciales.validarCorreo("  brayian.piedrahita@pastoreando.co "));
    }

    @Test
    public void un_correo_vacio_se_rechaza() {
        assertEquals(ErrorValidacion.VACIO, ValidadorCredenciales.validarCorreo(""));
        assertEquals(ErrorValidacion.VACIO, ValidadorCredenciales.validarCorreo(null));
    }

    @Test
    public void un_correo_sin_arroba_o_sin_dominio_se_rechaza() {
        assertEquals(ErrorValidacion.CORREO_INVALIDO, ValidadorCredenciales.validarCorreo("carlos.ramirez"));
        assertEquals(ErrorValidacion.CORREO_INVALIDO, ValidadorCredenciales.validarCorreo("carlos@pastoreando"));
        assertEquals(ErrorValidacion.CORREO_INVALIDO, ValidadorCredenciales.validarCorreo("car los@pastoreando.co"));
    }

    @Test
    public void la_clave_vacia_se_rechaza() {
        assertEquals(ErrorValidacion.VACIO, ValidadorCredenciales.validarClave(""));
        assertEquals(ErrorValidacion.VACIO, ValidadorCredenciales.validarClave(null));
    }

    @Test
    public void cualquier_clave_con_contenido_pasa_la_validacion_local() {
        assertNull(ValidadorCredenciales.validarClave("x"));
    }
}
