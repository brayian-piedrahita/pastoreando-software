package co.pastoreando.web;

import co.pastoreando.controlador.LoteControlador;
import co.pastoreando.dao.ConexionBD;
import co.pastoreando.dao.LoteDAOJdbc;
import co.pastoreando.excepcion.AccesoDatosException;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**
 * Se ejecuta una sola vez cuando Tomcat despliega la aplicacion. Arma el
 * controlador (ConexionBD, LoteDAOJdbc, LoteControlador) y lo publica en el
 * contexto para que todos los servlets compartan la misma instancia.
 *
 * <p>Si falta el archivo db.properties o la configuracion es invalida, la
 * aplicacion igual arranca: el motivo queda en el contexto y las paginas lo
 * muestran en la pantalla de error, en lugar de dejar un despliegue fallido
 * con un mensaje dificil de encontrar en los registros de Tomcat.</p>
 */
@WebListener
public class ContextListener implements ServletContextListener {

    /** Atributo del contexto con el controlador compartido. */
    public static final String ATRIBUTO_CONTROLADOR = "loteControlador";

    /** Atributo del contexto con el motivo por el que no se pudo armar el controlador. */
    public static final String ATRIBUTO_ERROR_INICIO = "errorInicio";

    @Override
    public void contextInitialized(ServletContextEvent evento) {
        ServletContext contexto = evento.getServletContext();
        try {
            ConexionBD conexionBD = ConexionBD.getInstancia();
            conexionBD.probarConexion();
            contexto.setAttribute(ATRIBUTO_CONTROLADOR, new LoteControlador(new LoteDAOJdbc(conexionBD)));
            contexto.log("Pastoreando: conexion con la base de datos verificada.");
        } catch (AccesoDatosException e) {
            contexto.setAttribute(ATRIBUTO_ERROR_INICIO, e.getMessage());
            contexto.log("Pastoreando: no se pudo iniciar el acceso a datos. " + e.getMessage());
        }
    }

    /**
     * Entrega el controlador compartido a los servlets.
     *
     * @throws AccesoDatosException con el motivo original si el listener no pudo armarlo
     */
    public static LoteControlador obtenerControlador(ServletContext contexto) {
        Object controlador = contexto.getAttribute(ATRIBUTO_CONTROLADOR);
        if (controlador instanceof LoteControlador) {
            return (LoteControlador) controlador;
        }
        Object motivo = contexto.getAttribute(ATRIBUTO_ERROR_INICIO);
        throw new AccesoDatosException(motivo != null ? motivo.toString()
                : "La aplicacion no pudo iniciar el acceso a datos.", null);
    }

    @Override
    public void contextDestroyed(ServletContextEvent evento) {
        evento.getServletContext().removeAttribute(ATRIBUTO_CONTROLADOR);
    }
}
