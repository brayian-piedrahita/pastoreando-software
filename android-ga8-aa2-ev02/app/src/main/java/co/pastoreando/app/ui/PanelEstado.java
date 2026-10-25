package co.pastoreando.app.ui;

import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import co.pastoreando.app.R;

/**
 * Componente reutilizable que cubre la pantalla con uno de tres estados: cargando, error con
 * boton para reintentar, o vacio. Envuelve el diseno {@code view_panel_estado}.
 */
public final class PanelEstado {

    private final View raiz;
    private final ProgressBar progreso;
    private final TextView mensaje;
    private final Button reintentar;

    public PanelEstado(View raiz) {
        this.raiz = raiz;
        this.progreso = raiz.findViewById(R.id.panelProgreso);
        this.mensaje = raiz.findViewById(R.id.panelMensaje);
        this.reintentar = raiz.findViewById(R.id.panelReintentar);
    }

    public void cargando(String texto) {
        mostrar(texto, R.color.texto_principal, true, null);
    }

    public void error(String texto, final Runnable alReintentar) {
        mostrar(texto, R.color.rojo_alerta, false, alReintentar);
    }

    public void vacio(String texto) {
        mostrar(texto, R.color.texto_secundario, false, null);
    }

    public void ocultar() {
        raiz.setVisibility(View.GONE);
    }

    private void mostrar(String texto, int colorTexto, boolean conProgreso, final Runnable alReintentar) {
        raiz.setVisibility(View.VISIBLE);
        progreso.setVisibility(conProgreso ? View.VISIBLE : View.GONE);
        mensaje.setText(texto);
        mensaje.setTextColor(ContextCompat.getColor(raiz.getContext(), colorTexto));
        if (alReintentar == null) {
            reintentar.setVisibility(View.GONE);
            reintentar.setOnClickListener(null);
        } else {
            reintentar.setVisibility(View.VISIBLE);
            reintentar.setOnClickListener(vista -> alReintentar.run());
        }
    }
}
