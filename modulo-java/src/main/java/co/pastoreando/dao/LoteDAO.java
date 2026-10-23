package co.pastoreando.dao;

import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.Lote;

import java.util.List;
import java.util.Optional;

/**
 * Contrato de acceso a datos del modulo de lotes. Todas las consultas y
 * modificaciones se acotan al propietario para que nadie opere sobre lotes ajenos.
 */
public interface LoteDAO {

    /**
     * Inserta un lote (Create).
     *
     * @return el identificador que genero la base de datos
     */
    int insertar(Lote lote);

    /** Busca un lote del propietario junto con su carga actual (Read). */
    Optional<CargaLote> buscarPorId(int idLote, int idPropietario);

    /** Lista los lotes del propietario con su carga actual, ordenados por id (Read). */
    List<CargaLote> listarPorPropietario(int idPropietario);

    /**
     * Actualiza nombre, hectareas, capacidad y pastura del lote (Update).
     *
     * @return true si el lote existe y pertenece al propietario
     */
    boolean actualizar(Lote lote);

    /**
     * Elimina el lote (Delete).
     *
     * @return true si el lote existia y pertenecia al propietario
     */
    boolean eliminar(int idLote, int idPropietario);

    /** Cuenta los contratos del lote, de cualquier estado. */
    int contarContratos(int idLote);

    /** Indica si el usuario existe y tiene el rol Propietario. */
    boolean esPropietario(int idUsuario);
}
