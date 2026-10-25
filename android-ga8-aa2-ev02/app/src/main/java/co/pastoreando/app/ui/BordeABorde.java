package co.pastoreando.app.ui;

import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

/**
 * Con la pantalla de borde a borde (obligatoria desde Android 15) el contenido queda bajo las
 * barras del sistema; este ayudante agrega el relleno que corresponde, incluido el teclado.
 */
public final class BordeABorde {

    private BordeABorde() {
    }

    /**
     * @param raiz     vista raiz de la pantalla
     * @param cabecera franja de color en la parte superior, que se estira bajo la barra de estado;
     *                 null si la pantalla no tiene cabecera
     */
    public static void aplicar(final View raiz, final View cabecera) {
        final int rellenoCabecera = cabecera == null ? 0 : cabecera.getPaddingTop();
        ViewCompat.setOnApplyWindowInsetsListener(raiz, (vista, insets) -> {
            Insets barras = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets teclado = insets.getInsets(WindowInsetsCompat.Type.ime());
            int abajo = Math.max(barras.bottom, teclado.bottom);
            if (cabecera != null) {
                cabecera.setPadding(cabecera.getPaddingLeft(), rellenoCabecera + barras.top,
                        cabecera.getPaddingRight(), cabecera.getPaddingBottom());
                vista.setPadding(barras.left, 0, barras.right, abajo);
            } else {
                vista.setPadding(barras.left, barras.top, barras.right, abajo);
            }
            return insets;
        });
    }
}
