package co.pastoreando.web;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

/**
 * Protege el modulo de lotes: solo deja pasar a quien ya se identifico como
 * propietario en {@link SesionServlet}. Los demas son enviados al formulario
 * de ingreso.
 */
@WebFilter(filterName = "SesionFilter", urlPatterns = "/lotes")
public class SesionFilter implements Filter {

    @Override
    public void doFilter(ServletRequest peticion, ServletResponse respuesta, FilterChain cadena)
            throws IOException, ServletException {
        HttpServletRequest http = (HttpServletRequest) peticion;
        HttpSession sesion = http.getSession(false);

        boolean identificado = sesion != null
                && sesion.getAttribute(SesionServlet.ATRIBUTO_PROPIETARIO) != null;
        if (identificado) {
            cadena.doFilter(peticion, respuesta);
        } else {
            ((HttpServletResponse) respuesta).sendRedirect(http.getContextPath() + "/sesion");
        }
    }
}
