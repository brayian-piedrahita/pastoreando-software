package co.pastoreando.app.modelo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/** El rol decide que opciones ve cada usuario en la app (minimo privilegio). */
public class RolTest {

    @Test
    public void reconoce_los_cuatro_roles_del_sistema() {
        assertEquals(Rol.PROPIETARIO, Rol.desde("Propietario"));
        assertEquals(Rol.ARRENDATARIO, Rol.desde("Arrendatario"));
        assertEquals(Rol.TECNICO, Rol.desde("Tecnico"));
        assertEquals(Rol.CONTADOR, Rol.desde("Contador"));
    }

    @Test
    public void ignora_tildes_y_mayusculas() {
        assertEquals(Rol.TECNICO, Rol.desde("  T\u00c9CNICO "));
    }

    @Test
    public void un_texto_desconocido_o_nulo_no_tiene_permisos() {
        assertEquals(Rol.DESCONOCIDO, Rol.desde("Administrador"));
        assertEquals(Rol.DESCONOCIDO, Rol.desde(null));
        assertFalse(Rol.DESCONOCIDO.puedeCalcularCostos());
    }

    @Test
    public void propietario_arrendatario_y_contador_calculan_costos() {
        assertTrue(Rol.PROPIETARIO.puedeCalcularCostos());
        assertTrue(Rol.ARRENDATARIO.puedeCalcularCostos());
        assertTrue(Rol.CONTADOR.puedeCalcularCostos());
    }

    @Test
    public void el_tecnico_no_calcula_costos() {
        assertFalse(Rol.TECNICO.puedeCalcularCostos());
    }
}
