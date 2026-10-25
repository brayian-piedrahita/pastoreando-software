package co.pastoreando.app.ui;

import android.content.Context;

import co.pastoreando.app.R;
import co.pastoreando.app.datos.ErrorApi;
import co.pastoreando.app.dominio.ErrorValidacion;
import co.pastoreando.app.modelo.NivelCarga;
import co.pastoreando.app.modelo.Rol;

/** Traduce los codigos del dominio y de la capa de datos a los textos que ve el usuario. */
public final class Textos {

    private Textos() {
    }

    /** Aviso para un error de red o del servidor. */
    public static String error(Context contexto, ErrorApi error) {
        switch (error.getTipo()) {
            case SIN_CONEXION:
                return contexto.getString(R.string.error_sin_conexion);
            case TIEMPO_AGOTADO:
                return contexto.getString(R.string.error_tiempo_agotado);
            case NO_AUTENTICADO:
                return contexto.getString(R.string.error_sesion_vencida);
            case SIN_PERMISO:
                return contexto.getString(R.string.error_sin_permiso);
            case NO_ENCONTRADO:
                return contexto.getString(R.string.error_no_encontrado);
            case DATOS_INVALIDOS:
                return error.getDetalle().isEmpty()
                        ? contexto.getString(R.string.error_datos)
                        : error.getDetalle();
            case RESPUESTA_INVALIDA:
                return contexto.getString(R.string.error_respuesta);
            case SERVIDOR:
            default:
                return contexto.getString(R.string.error_servidor);
        }
    }

    /** En el inicio de sesion un 401 significa credenciales incorrectas, no sesion vencida. */
    public static String errorInicioSesion(Context contexto, ErrorApi error) {
        if (error.getTipo() == ErrorApi.Tipo.NO_AUTENTICADO) {
            return contexto.getString(R.string.error_credenciales);
        }
        return error(contexto, error);
    }

    /** Recurso de texto para un motivo de validacion. */
    public static int validacion(ErrorValidacion motivo) {
        switch (motivo) {
            case VACIO:
                return R.string.val_vacio;
            case CORREO_INVALIDO:
                return R.string.val_correo;
            case NO_NUMERICO:
                return R.string.val_no_numerico;
            case NEGATIVO:
                return R.string.val_negativo;
            case DEBE_SER_POSITIVO:
                return R.string.val_positivo;
            case NO_ENTERO:
                return R.string.val_entero;
            case SIN_RUBROS:
            default:
                return R.string.val_sin_rubros;
        }
    }

    public static String rol(Context contexto, Rol rol) {
        switch (rol) {
            case PROPIETARIO:
                return contexto.getString(R.string.rol_propietario);
            case ARRENDATARIO:
                return contexto.getString(R.string.rol_arrendatario);
            case TECNICO:
                return contexto.getString(R.string.rol_tecnico);
            case CONTADOR:
                return contexto.getString(R.string.rol_contador);
            case DESCONOCIDO:
            default:
                return contexto.getString(R.string.rol_desconocido);
        }
    }

    public static String nivel(Context contexto, NivelCarga nivel) {
        switch (nivel) {
            case ALERTA:
                return contexto.getString(R.string.nivel_alerta);
            case SOBRECARGA:
                return contexto.getString(R.string.nivel_sobrecarga);
            case NORMAL:
            default:
                return contexto.getString(R.string.nivel_normal);
        }
    }
}
