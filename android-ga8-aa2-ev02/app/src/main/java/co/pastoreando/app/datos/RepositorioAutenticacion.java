package co.pastoreando.app.datos;

import co.pastoreando.app.modelo.SesionIniciada;

/** Inicio de sesion contra POST /auth/login. */
public final class RepositorioAutenticacion {

    private final ServicioHttp http;

    public RepositorioAutenticacion(ServicioHttp http) {
        this.http = http;
    }

    /**
     * Valida las credenciales en el servidor y entrega el token con los datos del usuario.
     * La contrasena solo viaja en esta peticion; la app no la guarda.
     */
    public SesionIniciada iniciarSesion(String correo, String clave) throws ErrorApi {
        RespuestaHttp respuesta = http.post(
                "/auth/login", ConversorJson.cuerpoLogin(correo, clave), null, true);
        return ConversorJson.sesion(respuesta.getCuerpo());
    }
}
