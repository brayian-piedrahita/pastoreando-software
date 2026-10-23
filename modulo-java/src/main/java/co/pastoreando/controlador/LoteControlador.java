package co.pastoreando.controlador;

import co.pastoreando.dao.LoteDAO;
import co.pastoreando.excepcion.ReglaNegocioException;
import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.Lote;

import java.util.List;

/**
 * Casos de uso del modulo de lotes. Valida los datos, aplica las reglas del
 * negocio (el propietario solo opera sobre sus lotes, no se elimina un lote con
 * contratos) y delega la persistencia en el {@link LoteDAO}.
 *
 * <p>Recibe los datos como texto para que la misma clase atienda hoy a la
 * consola y manana a los formularios web.</p>
 */
public class LoteControlador {

    private final LoteDAO loteDAO;

    public LoteControlador(LoteDAO loteDAO) {
        this.loteDAO = loteDAO;
    }

    /** Confirma que el usuario existe y tiene rol Propietario. */
    public void verificarPropietario(int idPropietario) {
        if (idPropietario <= 0 || !loteDAO.esPropietario(idPropietario)) {
            throw new ReglaNegocioException(
                    "El usuario indicado no existe o no tiene el rol de Propietario.");
        }
    }

    /** Registra un lote nuevo y devuelve su estado de carga (inicia en 0 cabezas). */
    public CargaLote registrarLote(int idPropietario, String nombreLote, String hectareas,
                                   String capacidadCarga, String tipoPastura) {
        Lote lote = ValidadorLote.validar(
                idPropietario, nombreLote, hectareas, capacidadCarga, tipoPastura);
        verificarPropietario(idPropietario);
        int idLote = loteDAO.insertar(lote);
        return consultarLote(idLote, idPropietario);
    }

    /** Lista los lotes del propietario con su carga actual. */
    public List<CargaLote> listarLotes(int idPropietario) {
        return loteDAO.listarPorPropietario(idPropietario);
    }

    /** Consulta un lote del propietario con su carga actual (monitoreo, RF04). */
    public CargaLote consultarLote(int idLote, int idPropietario) {
        return loteDAO.buscarPorId(idLote, idPropietario)
                .orElseThrow(() -> loteNoEncontrado(idLote));
    }

    /** Actualiza los datos editables del lote y devuelve su nueva carga. */
    public CargaLote actualizarLote(int idLote, int idPropietario, String nombreLote,
                                    String hectareas, String capacidadCarga, String tipoPastura) {
        Lote lote = ValidadorLote.validar(
                idPropietario, nombreLote, hectareas, capacidadCarga, tipoPastura);
        lote.setIdLote(idLote);
        if (!loteDAO.actualizar(lote)) {
            throw loteNoEncontrado(idLote);
        }
        return consultarLote(idLote, idPropietario);
    }

    /**
     * Elimina un lote del propietario. Si tiene contratos, de cualquier estado,
     * no se elimina: el historial de arrendamientos depende de el.
     */
    public void eliminarLote(int idLote, int idPropietario) {
        CargaLote carga = consultarLote(idLote, idPropietario);
        int contratos = loteDAO.contarContratos(idLote);
        if (contratos > 0) {
            throw new ReglaNegocioException("No se puede eliminar '"
                    + carga.getLote().getNombreLote() + "': tiene " + contratos
                    + (contratos == 1 ? " contrato asociado" : " contratos asociados")
                    + " (activos o historicos).");
        }
        if (!loteDAO.eliminar(idLote, idPropietario)) {
            throw loteNoEncontrado(idLote);
        }
    }

    private ReglaNegocioException loteNoEncontrado(int idLote) {
        return new ReglaNegocioException(
                "El lote " + idLote + " no existe o no pertenece al propietario en sesion.");
    }
}
