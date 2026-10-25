package co.pastoreando.app.ui;

import android.os.Handler;
import android.os.Looper;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import co.pastoreando.app.datos.ErrorApi;

/**
 * Ejecuta el trabajo de red en un hilo de fondo y entrega el resultado en el hilo principal,
 * que es el unico que puede tocar la pantalla.
 */
public final class TareaFondo {

    private static final ExecutorService HILOS = Executors.newFixedThreadPool(2);
    private static final Handler PRINCIPAL = new Handler(Looper.getMainLooper());

    private TareaFondo() {
    }

    /** Trabajo que se ejecuta fuera del hilo principal. */
    public interface Trabajo<T> {
        T ejecutar() throws ErrorApi;
    }

    /** Receptor del resultado; ambos metodos se llaman en el hilo principal. */
    public interface Resultado<T> {
        void alExito(T valor);

        void alError(ErrorApi error);
    }

    public static <T> void ejecutar(final Trabajo<T> trabajo, final Resultado<T> resultado) {
        HILOS.execute(() -> {
            try {
                final T valor = trabajo.ejecutar();
                PRINCIPAL.post(() -> resultado.alExito(valor));
            } catch (ErrorApi error) {
                PRINCIPAL.post(() -> resultado.alError(error));
            } catch (RuntimeException inesperado) {
                PRINCIPAL.post(() -> resultado.alError(ErrorApi.respuestaInvalida(inesperado)));
            }
        });
    }
}
