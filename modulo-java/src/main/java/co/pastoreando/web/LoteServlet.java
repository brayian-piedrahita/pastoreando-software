package co.pastoreando.web;

import co.pastoreando.controlador.LoteControlador;
import co.pastoreando.controlador.ValidadorLote;
import co.pastoreando.excepcion.ReglaNegocioException;
import co.pastoreando.excepcion.ValidacionException;
import co.pastoreando.modelo.CargaLote;
import co.pastoreando.modelo.EstadoCarga;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

/**
 * Controlador web del modulo de lotes. Un solo servlet atiende las dos clases
 * de peticion:
 *
 * <ul>
 *   <li><b>GET</b> (consultas, no modifican datos): {@code listar} (por defecto,
 *       con filtros {@code estado} y {@code q}), {@code nuevo}, {@code editar},
 *       {@code ver} y {@code eliminar} (pantalla de confirmacion).</li>
 *   <li><b>POST</b> (cambios): {@code crear}, {@code actualizar} y
 *       {@code eliminar}. Terminan con un redirect y un mensaje flash.</li>
 * </ul>
 *
 * <p>Las validaciones y las reglas del negocio viven en {@link LoteControlador};
 * el servlet solo traduce parametros, elige la pagina y arma los atributos.</p>
 */
@WebServlet(name = "LoteServlet", urlPatterns = "/lotes")
public class LoteServlet extends HttpServlet {

    static final String VISTA_LISTA = "/WEB-INF/vistas/lotes.jsp";
    static final String VISTA_FORMULARIO = "/WEB-INF/vistas/form.jsp";
    static final String VISTA_FICHA = "/WEB-INF/vistas/ficha.jsp";

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest peticion, HttpServletResponse respuesta)
            throws ServletException, IOException {
        Integer idPropietario = propietarioEnSesion(peticion, respuesta);
        if (idPropietario == null) {
            return;
        }
        MensajeFlash.trasladarAlRequest(peticion);
        LoteControlador controlador = ContextListener.obtenerControlador(peticion.getServletContext());
        String accion = valorOPredeterminado(peticion.getParameter("accion"), "listar");

        try {
            switch (accion) {
                case "listar" -> mostrarLista(peticion, respuesta, controlador, idPropietario);
                case "nuevo" -> mostrarFormulario(peticion, respuesta, "crear", new DatosLote());
                case "editar" -> {
                    CargaLote carga = consultar(peticion, controlador, idPropietario);
                    mostrarFormulario(peticion, respuesta, "actualizar", DatosLote.desde(carga.getLote()));
                }
                case "ver" -> mostrarFicha(peticion, respuesta,
                        consultar(peticion, controlador, idPropietario), false);
                case "eliminar" -> mostrarFicha(peticion, respuesta,
                        consultar(peticion, controlador, idPropietario), true);
                default -> respuesta.sendError(HttpServletResponse.SC_BAD_REQUEST,
                        "La accion solicitada no existe.");
            }
        } catch (ValidacionException | ReglaNegocioException e) {
            avisarYVolverALista(peticion, respuesta, MensajeFlash.TIPO_ERROR, e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest peticion, HttpServletResponse respuesta)
            throws ServletException, IOException {
        Integer idPropietario = propietarioEnSesion(peticion, respuesta);
        if (idPropietario == null) {
            return;
        }
        LoteControlador controlador = ContextListener.obtenerControlador(peticion.getServletContext());
        String accion = valorOPredeterminado(peticion.getParameter("accion"), "");

        try {
            switch (accion) {
                case "crear" -> crear(peticion, respuesta, controlador, idPropietario);
                case "actualizar" -> actualizar(peticion, respuesta, controlador, idPropietario);
                case "eliminar" -> eliminar(peticion, respuesta, controlador, idPropietario);
                default -> respuesta.sendError(HttpServletResponse.SC_BAD_REQUEST,
                        "La accion solicitada no existe.");
            }
        } catch (ValidacionException | ReglaNegocioException e) {
            avisarYVolverALista(peticion, respuesta, MensajeFlash.TIPO_ERROR, e.getMessage());
        }
    }

    // ---- GET -------------------------------------------------------------

    private void mostrarLista(HttpServletRequest peticion, HttpServletResponse respuesta,
                              LoteControlador controlador, int idPropietario)
            throws ServletException, IOException {
        List<CargaLote> todos = controlador.listarLotes(idPropietario);
        String estado = valorOPredeterminado(peticion.getParameter("estado"), FiltroLotes.TODOS);
        String texto = valorOPredeterminado(peticion.getParameter("q"), "");

        peticion.setAttribute("lotes", FiltroLotes.aplicar(todos, estado, texto));
        peticion.setAttribute("totalLotes", todos.size());
        peticion.setAttribute("totalNormal", FiltroLotes.contar(todos, EstadoCarga.NORMAL));
        peticion.setAttribute("totalAlerta", FiltroLotes.contar(todos, EstadoCarga.ALERTA));
        peticion.setAttribute("totalSobrecarga", FiltroLotes.contar(todos, EstadoCarga.SOBRECARGA));
        peticion.setAttribute("filtroEstado", estado.toUpperCase(Locale.ROOT));
        peticion.setAttribute("filtroTexto", texto);
        peticion.getRequestDispatcher(VISTA_LISTA).forward(peticion, respuesta);
    }

    private void mostrarFormulario(HttpServletRequest peticion, HttpServletResponse respuesta,
                                   String modo, DatosLote datos) throws ServletException, IOException {
        peticion.setAttribute("modo", modo);
        peticion.setAttribute("datos", datos);
        peticion.getRequestDispatcher(VISTA_FORMULARIO).forward(peticion, respuesta);
    }

    private void mostrarFicha(HttpServletRequest peticion, HttpServletResponse respuesta,
                              CargaLote carga, boolean pedirConfirmacion)
            throws ServletException, IOException {
        peticion.setAttribute("carga", carga);
        peticion.setAttribute("confirmarEliminacion", pedirConfirmacion);
        peticion.getRequestDispatcher(VISTA_FICHA).forward(peticion, respuesta);
    }

    // ---- POST ------------------------------------------------------------

    private void crear(HttpServletRequest peticion, HttpServletResponse respuesta,
                       LoteControlador controlador, int idPropietario)
            throws ServletException, IOException {
        DatosLote datos = DatosLote.desde(peticion);
        try {
            CargaLote carga = controlador.registrarLote(idPropietario, datos.getNombreLote(),
                    datos.getHectareas(), datos.getCapacidadCarga(), datos.getTipoPastura());
            int idNuevo = carga.getLote().getIdLote();
            MensajeFlash.guardar(peticion.getSession(), MensajeFlash.TIPO_EXITO,
                    "Lote registrado con el identificador " + idNuevo + ".");
            redirigir(peticion, respuesta, "/lotes?accion=ver&idLote=" + idNuevo);
        } catch (ValidacionException e) {
            devolverFormularioConError(peticion, respuesta, "crear", datos, e);
        }
    }

    private void actualizar(HttpServletRequest peticion, HttpServletResponse respuesta,
                            LoteControlador controlador, int idPropietario)
            throws ServletException, IOException {
        DatosLote datos = DatosLote.desde(peticion);
        try {
            int idLote = ValidadorLote.validarId("idLote", datos.getIdLote());
            controlador.actualizarLote(idLote, idPropietario, datos.getNombreLote(),
                    datos.getHectareas(), datos.getCapacidadCarga(), datos.getTipoPastura());
            MensajeFlash.guardar(peticion.getSession(), MensajeFlash.TIPO_EXITO,
                    "Los cambios del lote " + idLote + " se guardaron.");
            redirigir(peticion, respuesta, "/lotes?accion=ver&idLote=" + idLote);
        } catch (ValidacionException e) {
            devolverFormularioConError(peticion, respuesta, "actualizar", datos, e);
        }
    }

    private void eliminar(HttpServletRequest peticion, HttpServletResponse respuesta,
                          LoteControlador controlador, int idPropietario) throws IOException {
        int idLote = ValidadorLote.validarId("idLote", peticion.getParameter("idLote"));
        controlador.eliminarLote(idLote, idPropietario);
        MensajeFlash.guardar(peticion.getSession(), MensajeFlash.TIPO_EXITO,
                "El lote " + idLote + " fue eliminado.");
        redirigir(peticion, respuesta, "/lotes");
    }

    // ---- Apoyo -----------------------------------------------------------

    /** Devuelve el propietario de la sesion o redirige al ingreso si no hay sesion. */
    private Integer propietarioEnSesion(HttpServletRequest peticion, HttpServletResponse respuesta)
            throws IOException {
        HttpSession sesion = peticion.getSession(false);
        Object id = sesion == null ? null : sesion.getAttribute(SesionServlet.ATRIBUTO_PROPIETARIO);
        if (id instanceof Integer) {
            return (Integer) id;
        }
        redirigir(peticion, respuesta, "/sesion");
        return null;
    }

    private CargaLote consultar(HttpServletRequest peticion, LoteControlador controlador,
                                int idPropietario) {
        int idLote = ValidadorLote.validarId("idLote", peticion.getParameter("idLote"));
        return controlador.consultarLote(idLote, idPropietario);
    }

    /** Vuelve a mostrar el formulario con lo escrito y el mensaje del campo que fallo. */
    private void devolverFormularioConError(HttpServletRequest peticion, HttpServletResponse respuesta,
                                            String modo, DatosLote datos, ValidacionException error)
            throws ServletException, IOException {
        peticion.setAttribute("error", error.getMessage());
        peticion.setAttribute("campoError", error.getCampo());
        mostrarFormulario(peticion, respuesta, modo, datos);
    }

    private void avisarYVolverALista(HttpServletRequest peticion, HttpServletResponse respuesta,
                                     String tipo, String texto) throws IOException {
        MensajeFlash.guardar(peticion.getSession(), tipo, texto);
        redirigir(peticion, respuesta, "/lotes");
    }

    private void redirigir(HttpServletRequest peticion, HttpServletResponse respuesta, String ruta)
            throws IOException {
        respuesta.sendRedirect(respuesta.encodeRedirectURL(peticion.getContextPath() + ruta));
    }

    private String valorOPredeterminado(String valor, String predeterminado) {
        return valor == null || valor.isBlank() ? predeterminado : valor.trim();
    }
}
