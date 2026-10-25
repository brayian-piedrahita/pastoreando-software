package co.pastoreando.app.ui;

import android.content.Context;
import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import co.pastoreando.app.R;
import co.pastoreando.app.modelo.EstadoCarga;
import co.pastoreando.app.modelo.Lote;
import co.pastoreando.app.modelo.NivelCarga;

/** Lista de lotes: una tarjeta por lote con su semaforo de carga animal (RF04). */
public final class LoteAdapter extends RecyclerView.Adapter<LoteAdapter.FilaLote> {

    private final List<Lote> lotes = new ArrayList<>();

    /** Cambia el contenido de la lista. */
    public void reemplazar(List<Lote> nuevos) {
        lotes.clear();
        lotes.addAll(nuevos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public FilaLote onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
        View vista = LayoutInflater.from(padre.getContext()).inflate(R.layout.item_lote, padre, false);
        return new FilaLote(vista);
    }

    @Override
    public void onBindViewHolder(@NonNull FilaLote fila, int posicion) {
        fila.enlazar(lotes.get(posicion));
    }

    @Override
    public int getItemCount() {
        return lotes.size();
    }

    /** Vistas de una tarjeta de lote. */
    static final class FilaLote extends RecyclerView.ViewHolder {

        private final TextView tvNombre;
        private final TextView tvNivel;
        private final TextView tvDetalle;
        private final TextView tvCarga;
        private final ProgressBar barra;
        private final TextView tvMensaje;
        private final TextView tvSugerencias;

        FilaLote(View vista) {
            super(vista);
            tvNombre = vista.findViewById(R.id.tvNombreLote);
            tvNivel = vista.findViewById(R.id.tvNivel);
            tvDetalle = vista.findViewById(R.id.tvDetalleLote);
            tvCarga = vista.findViewById(R.id.tvCarga);
            barra = vista.findViewById(R.id.barraCarga);
            tvMensaje = vista.findViewById(R.id.tvMensajeLote);
            tvSugerencias = vista.findViewById(R.id.tvSugerencias);
        }

        void enlazar(Lote lote) {
            Context contexto = itemView.getContext();
            tvNombre.setText(lote.getNombreLote());
            tvDetalle.setText(contexto.getString(R.string.detalle_lote,
                    Formato.hectareas(lote.getHectareas()), lote.getTipoPastura()));

            EstadoCarga estado = lote.getEstado();
            if (estado == null) {
                tvNivel.setVisibility(View.GONE);
                tvCarga.setVisibility(View.GONE);
                barra.setVisibility(View.GONE);
                tvMensaje.setVisibility(View.GONE);
                tvSugerencias.setVisibility(View.GONE);
                return;
            }
            tvNivel.setVisibility(View.VISIBLE);
            tvCarga.setVisibility(View.VISIBLE);
            barra.setVisibility(View.VISIBLE);
            tvMensaje.setVisibility(View.VISIBLE);

            NivelCarga nivel = estado.getNivel();
            tvNivel.setText(Textos.nivel(contexto, nivel));
            tvNivel.setBackgroundResource(fondoNivel(nivel));
            // El texto sobre el ambar va oscuro para que se lea bien.
            tvNivel.setTextColor(ContextCompat.getColor(contexto,
                    nivel == NivelCarga.ALERTA ? R.color.texto_principal : R.color.superficie));

            tvCarga.setText(contexto.getString(R.string.carga_lote, estado.getCargaActual(),
                    estado.getCapacidadCarga(), Formato.porcentaje(estado.getPorcentaje())));
            barra.setProgress((int) Math.min(100, Math.round(estado.getPorcentaje())));
            barra.setProgressTintList(ColorStateList.valueOf(ContextCompat.getColor(contexto, colorNivel(nivel))));

            tvMensaje.setText(estado.getMensaje());
            tvMensaje.setTextColor(ContextCompat.getColor(contexto,
                    nivel == NivelCarga.SOBRECARGA ? R.color.rojo_alerta : R.color.texto_principal));

            String ayuda = textoAyuda(contexto, estado);
            tvSugerencias.setText(ayuda);
            tvSugerencias.setVisibility(ayuda.isEmpty() ? View.GONE : View.VISIBLE);
        }

        /** Excedente y sugerencias del servidor; solo cuando el lote no esta en nivel normal. */
        private static String textoAyuda(Context contexto, EstadoCarga estado) {
            if (estado.getNivel() == NivelCarga.NORMAL) {
                return "";
            }
            StringBuilder texto = new StringBuilder();
            if (estado.getExcedente() > 0) {
                texto.append(contexto.getString(R.string.excedente_lote, estado.getExcedente()));
            }
            if (!estado.getSugerencias().isEmpty()) {
                if (texto.length() > 0) {
                    texto.append('\n');
                }
                texto.append(estado.getSugerencias());
            }
            return texto.toString();
        }

        private static int fondoNivel(NivelCarga nivel) {
            switch (nivel) {
                case ALERTA:
                    return R.drawable.bg_nivel_alerta;
                case SOBRECARGA:
                    return R.drawable.bg_nivel_sobrecarga;
                case NORMAL:
                default:
                    return R.drawable.bg_nivel_normal;
            }
        }

        private static int colorNivel(NivelCarga nivel) {
            switch (nivel) {
                case ALERTA:
                    return R.color.ambar_alerta;
                case SOBRECARGA:
                    return R.color.rojo_alerta;
                case NORMAL:
                default:
                    return R.color.verde_agricola;
            }
        }
    }
}
