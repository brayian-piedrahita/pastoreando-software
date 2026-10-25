package co.pastoreando.app.modelo;

/** Resultado de un inicio de sesion correcto: el token de acceso y el usuario. */
public final class SesionIniciada {

    private final String token;
    private final Usuario usuario;

    public SesionIniciada(String token, Usuario usuario) {
        this.token = token;
        this.usuario = usuario;
    }

    public String getToken() {
        return token;
    }

    public Usuario getUsuario() {
        return usuario;
    }
}
