package co.pastoreando.apoyo;

import co.pastoreando.dao.LoteDAO;
import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.Lote;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;

/**
 * DAO de prueba que guarda los lotes en memoria. Permite probar el controlador
 * y la vista sin una base de datos.
 */
public class DAOEnMemoria implements LoteDAO {

    private final Map<Integer, Lote> lotes = new TreeMap<>();
    private final Map<Integer, Integer> cabezasPorLote = new HashMap<>();
    private final Map<Integer, Integer> contratosPorLote = new HashMap<>();
    private final Set<Integer> propietarios = new HashSet<>();
    private int siguienteId = 1;

    public void agregarPropietario(int idUsuario) {
        propietarios.add(idUsuario);
    }

    /** Simula contratos del lote; las cabezas cuentan como carga actual. */
    public void simularContratos(int idLote, int contratos, int cabezasActivas) {
        contratosPorLote.put(idLote, contratos);
        cabezasPorLote.put(idLote, cabezasActivas);
    }

    @Override
    public int insertar(Lote lote) {
        int id = siguienteId++;
        lotes.put(id, new Lote(id, lote.getIdPropietario(), lote.getNombreLote(),
                lote.getHectareas(), lote.getCapacidadCarga(), lote.getTipoPastura()));
        return id;
    }

    @Override
    public Optional<CargaLote> buscarPorId(int idLote, int idPropietario) {
        Lote lote = lotes.get(idLote);
        if (lote == null || lote.getIdPropietario() != idPropietario) {
            return Optional.empty();
        }
        return Optional.of(new CargaLote(lote, cabezasPorLote.getOrDefault(idLote, 0)));
    }

    @Override
    public List<CargaLote> listarPorPropietario(int idPropietario) {
        List<CargaLote> resultado = new ArrayList<>();
        for (Lote lote : lotes.values()) {
            if (lote.getIdPropietario() == idPropietario) {
                resultado.add(new CargaLote(lote, cabezasPorLote.getOrDefault(lote.getIdLote(), 0)));
            }
        }
        return resultado;
    }

    @Override
    public boolean actualizar(Lote lote) {
        Lote existente = lotes.get(lote.getIdLote());
        if (existente == null || existente.getIdPropietario() != lote.getIdPropietario()) {
            return false;
        }
        lotes.put(lote.getIdLote(), lote);
        return true;
    }

    @Override
    public boolean eliminar(int idLote, int idPropietario) {
        Lote existente = lotes.get(idLote);
        if (existente == null || existente.getIdPropietario() != idPropietario) {
            return false;
        }
        lotes.remove(idLote);
        return true;
    }

    @Override
    public int contarContratos(int idLote) {
        return contratosPorLote.getOrDefault(idLote, 0);
    }

    @Override
    public boolean esPropietario(int idUsuario) {
        return propietarios.contains(idUsuario);
    }
}
