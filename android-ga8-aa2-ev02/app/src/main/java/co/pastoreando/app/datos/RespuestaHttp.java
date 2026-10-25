package co.pastoreando.app.datos;

/** Respuesta correcta del servidor: estado HTTP y cuerpo en texto. */
public final class RespuestaHttp {

    private final int codigo;
    private final String cuerpo;

    public RespuestaHttp(int codigo, String cuerpo) {
        this.codigo = codigo;
        this.cuerpo = cuerpo == null ? "" : cuerpo;
    }

    public int getCodigo() {
        return codigo;
    }

    public String getCuerpo() {
        return cuerpo;
    }
}
