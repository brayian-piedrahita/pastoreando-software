package co.pastoreando.app.modelo;

/** Usuario autenticado. No guarda la contrasena: la app nunca la conserva. */
public final class Usuario {

    private final int idUsuario;
    private final String nombre;
    private final String apellidos;
    private final String correo;
    private final String rolTexto;

    public Usuario(int idUsuario, String nombre, String apellidos, String correo, String rolTexto) {
        this.idUsuario = idUsuario;
        this.nombre = nombre == null ? "" : nombre;
        this.apellidos = apellidos == null ? "" : apellidos;
        this.correo = correo == null ? "" : correo;
        this.rolTexto = rolTexto == null ? "" : rolTexto;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public String getNombre() {
        return nombre;
    }

    public String getApellidos() {
        return apellidos;
    }

    public String getCorreo() {
        return correo;
    }

    /** Rol tal como lo envia el servidor. */
    public String getRolTexto() {
        return rolTexto;
    }

    public Rol getRol() {
        return Rol.desde(rolTexto);
    }

    /** Nombre y apellidos para mostrar en pantalla. */
    public String getNombreCompleto() {
        return (nombre + " " + apellidos).trim();
    }
}
