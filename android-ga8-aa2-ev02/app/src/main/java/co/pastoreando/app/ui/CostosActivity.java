package co.pastoreando.app.ui;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RadioGroup;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import java.util.Map;

import co.pastoreando.app.Dependencias;
import co.pastoreando.app.R;
import co.pastoreando.app.almacen.SesionLocal;
import co.pastoreando.app.datos.ErrorApi;
import co.pastoreando.app.datos.RepositorioCostos;
import co.pastoreando.app.dominio.CampoCosto;
import co.pastoreando.app.dominio.ErrorValidacion;
import co.pastoreando.app.dominio.ResultadoValidacion;
import co.pastoreando.app.dominio.ValidadorCostos;
import co.pastoreando.app.modelo.EntradaCosto;
import co.pastoreando.app.modelo.ResultadoCosto;
import co.pastoreando.app.modelo.Usuario;

/**
 * Calculadora de costos por unidad ganadera (RF01) con desglose interactivo por rubro (RF02).
 * Valida el formulario antes de llamar al servidor y, si no hay conexion, calcula en el telefono
 * con las mismas reglas avisando que ese resultado no quedo en el historial.
 */
public class CostosActivity extends AppCompatActivity {

    private SesionLocal sesion;
    private TextInputLayout tilAlimentacion;
    private TextInputLayout tilMantenimiento;
    private TextInputLayout tilServicios;
    private TextInputLayout tilImpuestos;
    private TextInputLayout tilAnimales;
    private TextInputEditText etAlimentacion;
    private TextInputEditText etMantenimiento;
    private TextInputEditText etServicios;
    private TextInputEditText etImpuestos;
    private TextInputEditText etAnimales;
    private RadioGroup rgProposito;
    private MaterialButton btnCalcular;
    private ProgressBar progreso;
    private TextView tvError;
    private TextView tvBanner;
    private View tarjetaResultado;
    private ScrollView scroll;
    private boolean enCurso;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        sesion = new SesionLocal(this);
        Usuario usuario = sesion.getUsuario();
        if (!sesion.haySesion() || !usuario.getRol().puedeCalcularCostos()) {
            // Sin sesion o sin permiso: no hay nada que mostrar aqui.
            finish();
            return;
        }

        setContentView(R.layout.activity_costos);
        BordeABorde.aplicar(findViewById(R.id.raizCostos), findViewById(R.id.cabeceraCostos));

        tilAlimentacion = findViewById(R.id.tilAlimentacion);
        tilMantenimiento = findViewById(R.id.tilMantenimiento);
        tilServicios = findViewById(R.id.tilServicios);
        tilImpuestos = findViewById(R.id.tilImpuestos);
        tilAnimales = findViewById(R.id.tilAnimales);
        etAlimentacion = findViewById(R.id.etAlimentacion);
        etMantenimiento = findViewById(R.id.etMantenimiento);
        etServicios = findViewById(R.id.etServicios);
        etImpuestos = findViewById(R.id.etImpuestos);
        etAnimales = findViewById(R.id.etAnimales);
        rgProposito = findViewById(R.id.rgProposito);
        btnCalcular = findViewById(R.id.btnCalcular);
        progreso = findViewById(R.id.progresoCostos);
        tvError = findViewById(R.id.tvErrorCostos);
        tvBanner = findViewById(R.id.tvBannerCostos);
        tarjetaResultado = findViewById(R.id.tarjetaResultado);
        scroll = findViewById(R.id.scrollCostos);

        btnCalcular.setOnClickListener(vista -> calcular());
        findViewById(R.id.btnLimpiar).setOnClickListener(vista -> limpiar());
        findViewById(R.id.btnVolver).setOnClickListener(vista -> finish());
    }

    private void calcular() {
        if (enCurso) {
            return;
        }
        ocultarTeclado();
        limpiarErrores();
        ResultadoValidacion validacion = new ValidadorCostos().validar(
                texto(etAlimentacion), texto(etMantenimiento), texto(etServicios),
                texto(etImpuestos), texto(etAnimales), propositoElegido());
        if (!validacion.esValido()) {
            mostrarErrores(validacion.getErrores());
            return;
        }

        tarjetaResultado.setVisibility(View.GONE);
        tvBanner.setVisibility(View.GONE);
        mostrarCargando(true);

        final EntradaCosto entrada = validacion.getEntrada();
        final String token = sesion.getToken();
        final RepositorioCostos repositorio = Dependencias.costos();
        TareaFondo.ejecutar(
                () -> repositorio.calcular(token, entrada),
                new TareaFondo.Resultado<ResultadoCosto>() {
                    @Override
                    public void alExito(ResultadoCosto resultado) {
                        if (isFinishing() || isDestroyed()) {
                            return;
                        }
                        mostrarCargando(false);
                        mostrarResultado(resultado);
                    }

                    @Override
                    public void alError(ErrorApi error) {
                        if (isFinishing() || isDestroyed()) {
                            return;
                        }
                        mostrarCargando(false);
                        if (error.getTipo() == ErrorApi.Tipo.NO_AUTENTICADO) {
                            cerrarPorSesionVencida();
                            return;
                        }
                        mostrarErrorServidor(error);
                    }
                });
    }

    private void mostrarResultado(ResultadoCosto resultado) {
        ((TextView) findViewById(R.id.tvCostoFinal)).setText(Formato.pesos(resultado.getCostoUnitarioFinal()));
        ((TextView) findViewById(R.id.tvTotalLote))
                .setText(getString(R.string.total_lote, Formato.pesos(resultado.getTotalLoteFinal())));
        ((TextView) findViewById(R.id.tvCostoBase))
                .setText(getString(R.string.costo_base, Formato.pesos(resultado.getCostoBasePorCabeza())));
        ((TextView) findViewById(R.id.tvFactor))
                .setText(getString(R.string.factor_manejo, Formato.factor(resultado.getFactorManejo())));
        ((TextView) findViewById(R.id.tvMargen))
                .setText(getString(R.string.margen_utilidad, Formato.pesos(resultado.getMargenPorCabeza())));
        DesgloseCostos.mostrar((LinearLayout) findViewById(R.id.contenedorDesglose), resultado.getDesglose());

        tvBanner.setVisibility(resultado.isCalculadoLocalmente() ? View.VISIBLE : View.GONE);
        tarjetaResultado.setVisibility(View.VISIBLE);
        scroll.post(() -> scroll.smoothScrollTo(0, tarjetaResultado.getTop()));
    }

    private void mostrarErrorServidor(ErrorApi error) {
        // Un 422 con campo conocido se marca en ese campo; el resto se muestra como aviso.
        TextInputLayout campo = campoPorNombre(error.getCampo());
        if (error.getTipo() == ErrorApi.Tipo.DATOS_INVALIDOS && campo != null) {
            campo.setError(Textos.error(this, error));
            return;
        }
        tvError.setText(Textos.error(this, error));
        tvError.setVisibility(View.VISIBLE);
    }

    private TextInputLayout campoPorNombre(String nombre) {
        switch (nombre) {
            case "alimentacion":
                return tilAlimentacion;
            case "mantenimiento":
                return tilMantenimiento;
            case "servicios":
                return tilServicios;
            case "impuestos":
                return tilImpuestos;
            case "cantidad_animales":
                return tilAnimales;
            default:
                return null;
        }
    }

    private void mostrarErrores(Map<CampoCosto, ErrorValidacion> errores) {
        for (Map.Entry<CampoCosto, ErrorValidacion> entrada : errores.entrySet()) {
            TextInputLayout til = tilDe(entrada.getKey());
            til.setError(getString(Textos.validacion(entrada.getValue())));
        }
    }

    private TextInputLayout tilDe(CampoCosto campo) {
        switch (campo) {
            case ALIMENTACION:
                return tilAlimentacion;
            case MANTENIMIENTO:
                return tilMantenimiento;
            case SERVICIOS:
                return tilServicios;
            case IMPUESTOS:
                return tilImpuestos;
            case ANIMALES:
            default:
                return tilAnimales;
        }
    }

    private void limpiarErrores() {
        tilAlimentacion.setError(null);
        tilMantenimiento.setError(null);
        tilServicios.setError(null);
        tilImpuestos.setError(null);
        tilAnimales.setError(null);
        tvError.setVisibility(View.GONE);
    }

    private void limpiar() {
        etAlimentacion.setText("");
        etMantenimiento.setText("");
        etServicios.setText("");
        etImpuestos.setText("");
        etAnimales.setText("");
        rgProposito.check(R.id.rbCarne);
        limpiarErrores();
        tarjetaResultado.setVisibility(View.GONE);
        tvBanner.setVisibility(View.GONE);
    }

    private void mostrarCargando(boolean cargando) {
        enCurso = cargando;
        btnCalcular.setEnabled(!cargando);
        btnCalcular.setText(cargando ? R.string.calculando : R.string.calcular);
        progreso.setVisibility(cargando ? View.VISIBLE : View.GONE);
    }

    /** Valor del proposito en el formato del servidor; viene en la etiqueta de cada opcion. */
    private String propositoElegido() {
        View elegido = findViewById(rgProposito.getCheckedRadioButtonId());
        return elegido == null ? "Carne" : String.valueOf(elegido.getTag());
    }

    private void cerrarPorSesionVencida() {
        sesion.cerrar();
        Toast.makeText(this, R.string.error_sesion_vencida, Toast.LENGTH_LONG).show();
        Intent intento = new Intent(this, LoginActivity.class);
        intento.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intento);
        finish();
    }

    private void ocultarTeclado() {
        View foco = getCurrentFocus();
        if (foco != null) {
            InputMethodManager teclado = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            if (teclado != null) {
                teclado.hideSoftInputFromWindow(foco.getWindowToken(), 0);
            }
        }
    }

    private static String texto(TextInputEditText campo) {
        return campo.getText() == null ? "" : campo.getText().toString().trim();
    }
}
