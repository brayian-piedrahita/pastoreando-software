package co.pastoreando.dao;

import co.pastoreando.excepcion.AccesoDatosException;
import co.pastoreando.excepcion.ReglaNegocioException;
import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.EstadoCarga;
import co.pastoreando.modelo.Lote;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Prueba de integracion del DAO contra MySQL real. Necesita el archivo
 * db.properties y los scripts sql/01_esquema.sql y sql/02_datos_prueba.sql
 * cargados; si la base no esta disponible, las pruebas se omiten.
 *
 * <p>Cada prueba que escribe crea sus propios lotes con el propietario 1 y los
 * elimina al terminar. Las pruebas de lectura suponen que los lotes 1, 2 y 3 de
 * los datos de prueba no se modificaron; para restaurarlos basta con recrear la
 * base (DROP DATABASE pastoreando) y volver a cargar los dos scripts SQL.</p>
 */
class LoteDAOJdbcIntegracionTest {

    private static final int PROPIETARIO = 1;
    private static final int OTRO_PROPIETARIO = 6;

    private static LoteDAOJdbc dao;

    @BeforeAll
    static void conectar() {
        try {
            ConexionBD conexionBD = ConexionBD.getInstancia();
            conexionBD.probarConexion();
            dao = new LoteDAOJdbc(conexionBD);
            Assumptions.assumeTrue(dao.esPropietario(PROPIETARIO),
                    "La base no tiene los datos de prueba (sql/02_datos_prueba.sql).");
        } catch (AccesoDatosException e) {
            Assumptions.abort("MySQL no disponible para la prueba de integracion: " + e.getMessage());
        }
    }

    private static Lote nuevoLote(String nombre) {
        return new Lote(0, PROPIETARIO, nombre, new BigDecimal("5.25"), 10, "Kikuyo");
    }

    @Test
    void recorreElCrudCompleto() {
        int idLote = dao.insertar(nuevoLote("Prueba JDBC"));
        try {
            Optional<CargaLote> creado = dao.buscarPorId(idLote, PROPIETARIO);
            assertTrue(creado.isPresent());
            assertEquals("Prueba JDBC", creado.get().getLote().getNombreLote());
            assertEquals(new BigDecimal("5.25"), creado.get().getLote().getHectareas());
            assertEquals(0, creado.get().getCabezasActuales());

            Lote cambios = new Lote(idLote, PROPIETARIO, "Prueba JDBC 2", new BigDecimal("6.00"), 12, "Brachiaria");
            assertTrue(dao.actualizar(cambios));
            CargaLote actualizado = dao.buscarPorId(idLote, PROPIETARIO).orElseThrow();
            assertEquals("Prueba JDBC 2", actualizado.getLote().getNombreLote());
            assertEquals(12, actualizado.getLote().getCapacidadCarga());
            assertEquals("Brachiaria", actualizado.getLote().getTipoPastura());
        } finally {
            assertTrue(dao.eliminar(idLote, PROPIETARIO));
        }
        assertFalse(dao.buscarPorId(idLote, PROPIETARIO).isPresent());
    }

    @Test
    void noOperaSobreLotesDeOtroPropietario() {
        int idLote = dao.insertar(nuevoLote("Prueba ajena"));
        try {
            assertFalse(dao.buscarPorId(idLote, OTRO_PROPIETARIO).isPresent());
            Lote intento = new Lote(idLote, OTRO_PROPIETARIO, "Robado", new BigDecimal("1.00"), 1, "Kikuyo");
            assertFalse(dao.actualizar(intento));
            assertFalse(dao.eliminar(idLote, OTRO_PROPIETARIO));
        } finally {
            assertTrue(dao.eliminar(idLote, PROPIETARIO));
        }
    }

    @Test
    void calculaLaCargaConLosContratosActivosDeLosDatosDePrueba() {
        List<CargaLote> lotes = dao.listarPorPropietario(PROPIETARIO);

        CargaLote lote01 = lotes.stream().filter(c -> c.getLote().getIdLote() == 1).findFirst().orElseThrow();
        CargaLote lote02 = lotes.stream().filter(c -> c.getLote().getIdLote() == 2).findFirst().orElseThrow();
        CargaLote lote03 = lotes.stream().filter(c -> c.getLote().getIdLote() == 3).findFirst().orElseThrow();

        // El contrato finalizado del Lote 01 (10 cabezas) no cuenta: 25 + 13 = 38.
        assertEquals(38, lote01.getCabezasActuales());
        assertEquals(EstadoCarga.ALERTA, lote01.getEstado());
        assertEquals(12, lote02.getCabezasActuales());
        assertEquals(EstadoCarga.NORMAL, lote02.getEstado());
        assertEquals(24, lote03.getCabezasActuales());
        assertEquals(EstadoCarga.SOBRECARGA, lote03.getEstado());
    }

    @Test
    void cuentaLosContratosDeCualquierEstado() {
        assertEquals(2, dao.contarContratos(1));
        assertEquals(0, dao.contarContratos(4));
    }

    @Test
    void laBaseImpideEliminarUnLoteConContratos() {
        // Salta el chequeo del controlador a proposito: la clave foranea es la ultima defensa.
        ReglaNegocioException error = assertThrows(ReglaNegocioException.class, () -> dao.eliminar(2, PROPIETARIO));
        assertTrue(error.getMessage().contains("contratos asociados"));
    }

    @Test
    void laBaseRechazaUnPropietarioInexistente() {
        Lote huerfano = new Lote(0, 9999, "Sin dueno", new BigDecimal("1.00"), 1, "Kikuyo");
        assertThrows(ReglaNegocioException.class, () -> dao.insertar(huerfano));
    }

    @Test
    void distingueElRolPropietario() {
        assertTrue(dao.esPropietario(PROPIETARIO));
        assertFalse(dao.esPropietario(2));
        assertFalse(dao.esPropietario(9999));
    }
}
