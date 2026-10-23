package co.pastoreando.web;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;

import java.io.IOException;

/**
 * Fija UTF-8 en la peticion antes de que algun servlet lea los parametros del
 * formulario. Sin esto, un nombre con tilde o con enie puede llegar mal
 * decodificado segun la configuracion del servidor.
 */
@WebFilter(filterName = "CodificacionFilter", urlPatterns = "/*")
public class CodificacionFilter implements Filter {

    private static final String UTF_8 = "UTF-8";

    @Override
    public void doFilter(ServletRequest peticion, ServletResponse respuesta, FilterChain cadena)
            throws IOException, ServletException {
        peticion.setCharacterEncoding(UTF_8);
        respuesta.setCharacterEncoding(UTF_8);
        cadena.doFilter(peticion, respuesta);
    }
}
