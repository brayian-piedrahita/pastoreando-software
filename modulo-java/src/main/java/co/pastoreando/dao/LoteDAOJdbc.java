package co.pastoreando.dao;

import co.pastoreando.excepcion.AccesoDatosException;
import co.pastoreando.excepcion.ReglaNegocioException;
import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.Lote;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Implementacion JDBC del acceso a datos de lotes sobre MySQL.
 *
 * <p>Todas las sentencias usan {@link PreparedStatement} con parametros
 * posicionales, de modo que los valores nunca se concatenan al SQL.</p>
 */
public class LoteDAOJdbc implements LoteDAO {

    /** Codigo de error de MySQL: la fila padre referenciada no existe (clave foranea). */
    private static final int ERROR_FK_PADRE_INEXISTENTE = 1452;

    /** Codigo de error de MySQL: la fila tiene filas hijas que la referencian. */
    private static final int ERROR_FK_HIJOS_EXISTENTES = 1451;

    private static final String SQL_INSERTAR = """
            INSERT INTO LOTES (idPropietario, nombreLote, hectareas, capacidadCarga, tipoPastura)
            VALUES (?, ?, ?, ?, ?)
            """;

    /** Lote con las cabezas de sus contratos activos (la carga actual). */
    private static final String SQL_SELECCIONAR_CON_CARGA = """
            SELECT l.idLote, l.idPropietario, l.nombreLote, l.hectareas,
                   l.capacidadCarga, l.tipoPastura,
                   COALESCE(SUM(CASE WHEN c.estado = 'Activo' THEN g.cantidadCabezas END), 0)
                       AS cabezasActuales
            FROM LOTES l
            LEFT JOIN CONTRATOS c ON c.idLote = l.idLote
            LEFT JOIN GANADO g ON g.idContrato = c.idContrato
            WHERE l.idPropietario = ?
            """;

    private static final String SQL_AGRUPAR_POR_LOTE = """
            GROUP BY l.idLote, l.idPropietario, l.nombreLote, l.hectareas,
                     l.capacidadCarga, l.tipoPastura
            """;

    private static final String SQL_LISTAR = SQL_SELECCIONAR_CON_CARGA
            + SQL_AGRUPAR_POR_LOTE + "ORDER BY l.idLote";

    private static final String SQL_BUSCAR = SQL_SELECCIONAR_CON_CARGA
            + "AND l.idLote = ?\n" + SQL_AGRUPAR_POR_LOTE;

    private static final String SQL_ACTUALIZAR = """
            UPDATE LOTES
            SET nombreLote = ?, hectareas = ?, capacidadCarga = ?, tipoPastura = ?
            WHERE idLote = ? AND idPropietario = ?
            """;

    private static final String SQL_ELIMINAR =
            "DELETE FROM LOTES WHERE idLote = ? AND idPropietario = ?";

    private static final String SQL_CONTAR_CONTRATOS =
            "SELECT COUNT(*) FROM CONTRATOS WHERE idLote = ?";

    private static final String SQL_ES_PROPIETARIO =
            "SELECT 1 FROM USUARIOS WHERE idUsuario = ? AND rolUsuario = 'Propietario'";

    private final ConexionBD conexionBD;

    public LoteDAOJdbc() {
        this(ConexionBD.getInstancia());
    }

    public LoteDAOJdbc(ConexionBD conexionBD) {
        this.conexionBD = conexionBD;
    }

    @Override
    public int insertar(Lote lote) {
        try (Connection conexion = conexionBD.obtenerConexion();
             PreparedStatement sentencia =
                     conexion.prepareStatement(SQL_INSERTAR, Statement.RETURN_GENERATED_KEYS)) {
            sentencia.setInt(1, lote.getIdPropietario());
            sentencia.setString(2, lote.getNombreLote());
            sentencia.setBigDecimal(3, lote.getHectareas());
            sentencia.setInt(4, lote.getCapacidadCarga());
            sentencia.setString(5, lote.getTipoPastura());
            sentencia.executeUpdate();
            try (ResultSet claves = sentencia.getGeneratedKeys()) {
                if (claves.next()) {
                    return claves.getInt(1);
                }
            }
            throw new AccesoDatosException(
                    "El lote se inserto, pero la base de datos no devolvio su identificador.", null);
        } catch (SQLException e) {
            throw traducir(e, "registrar el lote");
        }
    }

    @Override
    public Optional<CargaLote> buscarPorId(int idLote, int idPropietario) {
        try (Connection conexion = conexionBD.obtenerConexion();
             PreparedStatement sentencia = conexion.prepareStatement(SQL_BUSCAR)) {
            sentencia.setInt(1, idPropietario);
            sentencia.setInt(2, idLote);
            try (ResultSet resultado = sentencia.executeQuery()) {
                if (resultado.next()) {
                    return Optional.of(mapearCarga(resultado));
                }
                return Optional.empty();
            }
        } catch (SQLException e) {
            throw traducir(e, "consultar el lote");
        }
    }

    @Override
    public List<CargaLote> listarPorPropietario(int idPropietario) {
        List<CargaLote> lotes = new ArrayList<>();
        try (Connection conexion = conexionBD.obtenerConexion();
             PreparedStatement sentencia = conexion.prepareStatement(SQL_LISTAR)) {
            sentencia.setInt(1, idPropietario);
            try (ResultSet resultado = sentencia.executeQuery()) {
                while (resultado.next()) {
                    lotes.add(mapearCarga(resultado));
                }
            }
            return lotes;
        } catch (SQLException e) {
            throw traducir(e, "listar los lotes");
        }
    }

    @Override
    public boolean actualizar(Lote lote) {
        try (Connection conexion = conexionBD.obtenerConexion();
             PreparedStatement sentencia = conexion.prepareStatement(SQL_ACTUALIZAR)) {
            sentencia.setString(1, lote.getNombreLote());
            sentencia.setBigDecimal(2, lote.getHectareas());
            sentencia.setInt(3, lote.getCapacidadCarga());
            sentencia.setString(4, lote.getTipoPastura());
            sentencia.setInt(5, lote.getIdLote());
            sentencia.setInt(6, lote.getIdPropietario());
            return sentencia.executeUpdate() > 0;
        } catch (SQLException e) {
            throw traducir(e, "actualizar el lote");
        }
    }

    @Override
    public boolean eliminar(int idLote, int idPropietario) {
        try (Connection conexion = conexionBD.obtenerConexion();
             PreparedStatement sentencia = conexion.prepareStatement(SQL_ELIMINAR)) {
            sentencia.setInt(1, idLote);
            sentencia.setInt(2, idPropietario);
            return sentencia.executeUpdate() > 0;
        } catch (SQLException e) {
            throw traducir(e, "eliminar el lote");
        }
    }

    @Override
    public int contarContratos(int idLote) {
        try (Connection conexion = conexionBD.obtenerConexion();
             PreparedStatement sentencia = conexion.prepareStatement(SQL_CONTAR_CONTRATOS)) {
            sentencia.setInt(1, idLote);
            try (ResultSet resultado = sentencia.executeQuery()) {
                resultado.next();
                return resultado.getInt(1);
            }
        } catch (SQLException e) {
            throw traducir(e, "contar los contratos del lote");
        }
    }

    @Override
    public boolean esPropietario(int idUsuario) {
        try (Connection conexion = conexionBD.obtenerConexion();
             PreparedStatement sentencia = conexion.prepareStatement(SQL_ES_PROPIETARIO)) {
            sentencia.setInt(1, idUsuario);
            try (ResultSet resultado = sentencia.executeQuery()) {
                return resultado.next();
            }
        } catch (SQLException e) {
            throw traducir(e, "verificar el propietario");
        }
    }

    /** Convierte la fila actual del ResultSet en un lote con su carga. */
    private CargaLote mapearCarga(ResultSet resultado) throws SQLException {
        Lote lote = new Lote(
                resultado.getInt("idLote"),
                resultado.getInt("idPropietario"),
                resultado.getString("nombreLote"),
                resultado.getBigDecimal("hectareas"),
                resultado.getInt("capacidadCarga"),
                resultado.getString("tipoPastura"));
        return new CargaLote(lote, resultado.getInt("cabezasActuales"));
    }

    /**
     * Traduce un error de SQL a una excepcion del modulo. Las violaciones de
     * clave foranea se vuelven mensajes de negocio; el resto, un error tecnico.
     */
    private RuntimeException traducir(SQLException e, String accion) {
        switch (e.getErrorCode()) {
            case ERROR_FK_PADRE_INEXISTENTE:
                return new ReglaNegocioException("El propietario indicado no existe.");
            case ERROR_FK_HIJOS_EXISTENTES:
                return new ReglaNegocioException(
                        "No se puede eliminar el lote porque tiene contratos asociados.");
            default:
                return new AccesoDatosException(
                        "No fue posible " + accion + ": " + e.getMessage(), e);
        }
    }
}
