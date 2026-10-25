package co.pastoreando.app.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import co.pastoreando.app.Dependencias;
import co.pastoreando.app.R;
import co.pastoreando.app.almacen.SesionLocal;
import co.pastoreando.app.datos.ErrorApi;
import co.pastoreando.app.datos.ListaLotes;
import co.pastoreando.app.datos.RepositorioLotes;
import co.pastoreando.app.dominio.ResumenCarga;
import co.pastoreando.app.modelo.NivelCarga;
import co.pastoreando.app.modelo.Usuario;

/**
 * Pantalla principal: lista de lotes con el semaforo de carga animal (RF04). Muestra al usuario
 * y su rol, y solo ofrece la calculadora de costos a los roles que tienen permiso.
 */
public class LotesActivity extends AppCompatActivity {

    private SesionLocal sesion;
    private Usuario usuario;
    private LoteAdapter adaptador;
    private PanelEstado panel;
    private TextView tvResumen;
    private TextView tvBanner;
    private boolean cargando;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        sesion = new SesionLocal(this);
        if (!sesion.haySesion()) {
            irALogin();
            return;
        }
        usuario = sesion.getUsuario();

        setContentView(R.layout.activity_lotes);
        BordeABorde.aplicar(findViewById(R.id.raizLotes), findViewById(R.id.cabeceraLotes));

        ((TextView) findViewById(R.id.tvUsuario)).setText(getString(R.string.usuario_rol,
                usuario.getNombreCompleto(), Textos.rol(this, usuario.getRol())));
        tvResumen = findViewById(R.id.tvResumen);
        tvBanner = findViewById(R.id.tvBanner);

        RecyclerView lista = findViewById(R.id.rvLotes);
        lista.setLayoutManager(new LinearLayoutManager(this));
        adaptador = new LoteAdapter();
        lista.setAdapter(adaptador);
        panel = new PanelEstado(findViewById(R.id.panelEstado));

        Button btnCalculadora = findViewById(R.id.btnCalculadora);
        // Minimo privilegio: el tecnico no ve la calculadora; el servidor igual responde 403.
        btnCalculadora.setVisibility(usuario.getRol().puedeCalcularCostos() ? View.VISIBLE : View.GONE);
        btnCalculadora.setOnClickListener(vista -> startActivity(new Intent(this, CostosActivity.class)));
        findViewById(R.id.btnActualizar).setOnClickListener(vista -> cargarLotes());
        findViewById(R.id.btnSalir).setOnClickListener(vista -> cerrarSesion(0));

        cargarLotes();
    }

    private void cargarLotes() {
        if (cargando) {
            return;
        }
        cargando = true;
        tvBanner.setVisibility(View.GONE);
        panel.cargando(getString(R.string.cargando_lotes));

        final String token = sesion.getToken();
        final int idUsuario = usuario.getIdUsuario();
        final RepositorioLotes repositorio = Dependencias.lotes(this);
        TareaFondo.ejecutar(
                () -> repositorio.listar(token, idUsuario),
                new TareaFondo.Resultado<ListaLotes>() {
                    @Override
                    public void alExito(ListaLotes lista) {
                        cargando = false;
                        if (isFinishing() || isDestroyed()) {
                            return;
                        }
                        mostrar(lista);
                    }

                    @Override
                    public void alError(ErrorApi error) {
                        cargando = false;
                        if (isFinishing() || isDestroyed()) {
                            return;
                        }
                        if (error.getTipo() == ErrorApi.Tipo.NO_AUTENTICADO) {
                            cerrarSesion(R.string.error_sesion_vencida);
                            return;
                        }
                        panel.error(Textos.error(LotesActivity.this, error), () -> cargarLotes());
                    }
                });
    }

    private void mostrar(ListaLotes lista) {
        adaptador.reemplazar(lista.getLotes());
        ResumenCarga resumen = ResumenCarga.de(lista.getLotes());
        tvResumen.setText(resumen.total() == 0
                ? getString(R.string.resumen_sin_lotes)
                : getString(R.string.resumen_lotes,
                        resumen.cantidad(NivelCarga.NORMAL),
                        resumen.cantidad(NivelCarga.ALERTA),
                        resumen.cantidad(NivelCarga.SOBRECARGA)));
        tvBanner.setVisibility(lista.isDesdeCopiaLocal() ? View.VISIBLE : View.GONE);
        if (lista.getLotes().isEmpty()) {
            panel.vacio(getString(R.string.lotes_vacio));
        } else {
            panel.ocultar();
        }
    }

    private void cerrarSesion(int mensaje) {
        sesion.cerrar();
        if (mensaje != 0) {
            Toast.makeText(this, mensaje, Toast.LENGTH_LONG).show();
        }
        irALogin();
    }

    private void irALogin() {
        Intent intento = new Intent(this, LoginActivity.class);
        intento.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intento);
        finish();
    }
}
