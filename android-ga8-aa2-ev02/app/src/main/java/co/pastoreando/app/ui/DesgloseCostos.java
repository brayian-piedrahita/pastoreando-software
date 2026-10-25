package co.pastoreando.app.ui;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import java.util.List;

import co.pastoreando.app.R;
import co.pastoreando.app.modelo.RubroCosto;

/**
 * Componente reutilizable que dibuja el desglose de costos (RF02): una fila por rubro con su
 * peso en el total; al tocar una fila se despliega el valor del lote y el valor por cabeza.
 */
public final class DesgloseCostos {

    private DesgloseCostos() {
    }

    public static void mostrar(LinearLayout contenedor, List<RubroCosto> rubros) {
        contenedor.removeAllViews();
        Context contexto = contenedor.getContext();
        LayoutInflater inflador = LayoutInflater.from(contexto);
        for (RubroCosto rubro : rubros) {
            View fila = inflador.inflate(R.layout.item_rubro, contenedor, false);
            ((TextView) fila.findViewById(R.id.tvRubro)).setText(etiqueta(contexto, rubro.getNombre()));
            ((TextView) fila.findViewById(R.id.tvRubroPorcentaje))
                    .setText(Formato.porcentaje(rubro.getPorcentaje()));
            ProgressBar barra = fila.findViewById(R.id.barraRubro);
            barra.setProgress((int) Math.min(100, Math.round(rubro.getPorcentaje())));

            final TextView detalle = fila.findViewById(R.id.tvRubroDetalle);
            detalle.setText(contexto.getString(R.string.rubro_detalle,
                    Formato.pesos(rubro.getValorLote()), Formato.pesos(rubro.getValorPorCabeza())));
            fila.setOnClickListener(vista -> detalle.setVisibility(
                    detalle.getVisibility() == View.VISIBLE ? View.GONE : View.VISIBLE));
            contenedor.addView(fila);
        }
    }

    private static String etiqueta(Context contexto, String nombre) {
        String clave = Formato.claveRubro(nombre);
        switch (clave) {
            case "alimentacion":
                return contexto.getString(R.string.rubro_alimentacion);
            case "mantenimiento":
                return contexto.getString(R.string.rubro_mantenimiento);
            case "servicios":
                return contexto.getString(R.string.rubro_servicios);
            case "impuestos":
                return contexto.getString(R.string.rubro_impuestos);
            default:
                return nombre;
        }
    }
}
