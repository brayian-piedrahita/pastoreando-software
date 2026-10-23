package co.pastoreando.web;

import co.pastoreando.controlador.LoteControlador;
import co.pastoreando.controlador.ValidadorLote;
import co.pastoreando.excepcion.ReglaNegocioException;
import co.pastoreando.excepcion.ValidacionException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Ingreso y salida del propietario.
 *
 * <ul>
 *   <li>GET /sesion muestra el formulario de ingreso; con accion=salir cierra la sesion.</li>
 *   <li>POST /sesion recibe el identificador, comprueba que sea un propietario
 *       y abre la sesion.</li>
 * </ul>
 */
@WebServlet(name = "SesionServlet", urlPatterns = "/sesion")
public class SesionServlet extends HttpServlet {

    /** Atributo de sesion con el identificador del propietario identificado. */
    public static final String ATRIBUTO_PROPIETARIO = "idPropietario";

    static final String VISTA_LOGIN = "/WEB-INF/vistas/login.jsp";

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest peticion, HttpServletResponse respuesta)
            throws ServletException, IOException {
        if ("salir".equals(peticion.getParameter("accion"))) {
            HttpSession sesion = peticion.getSession(false);
            if (sesion != null) {
                sesion.invalidate();
            }
            respuesta.sendRedirect(peticion.getContextPath() + "/sesion?cerrada=1");
            return;
        }
        HttpSession sesion = peticion.getSession(false);
        if (sesion != null && sesion.getAttribute(ATRIBUTO_PROPIETARIO) != null) {
            respuesta.sendRedirect(peticion.getContextPath() + "/lotes");
            return;
        }
        peticion.getRequestDispatcher(VISTA_LOGIN).forward(peticion, respuesta);
    }

    @Override
    protected void doPost(HttpServletRequest peticion, HttpServletResponse respuesta)
            throws ServletException, IOException {
        String escrito = peticion.getParameter("idPropietario");
        try {
            int idPropietario = ValidadorLote.validarId("idPropietario", escrito);
            LoteControlador controlador = ContextListener.obtenerControlador(peticion.getServletContext());
            controlador.verificarPropietario(idPropietario);

            // Se descarta la sesion anterior para que un identificador de sesion
            // previo no sirva despues de autenticarse.
            HttpSession anterior = peticion.getSession(false);
            if (anterior != null) {
                anterior.invalidate();
            }
            HttpSession sesion = peticion.getSession(true);
            sesion.setAttribute(ATRIBUTO_PROPIETARIO, idPropietario);
            respuesta.sendRedirect(peticion.getContextPath() + "/lotes");
        } catch (ValidacionException | ReglaNegocioException e) {
            peticion.setAttribute("error", e.getMessage());
            peticion.setAttribute("idEscrito", escrito == null ? "" : escrito);
            peticion.getRequestDispatcher(VISTA_LOGIN).forward(peticion, respuesta);
        }
    }
}
