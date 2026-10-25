package co.pastoreando.app.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import co.pastoreando.app.Dependencias;
import co.pastoreando.app.R;
import co.pastoreando.app.almacen.SesionLocal;
import co.pastoreando.app.datos.ErrorApi;
import co.pastoreando.app.dominio.ErrorValidacion;
import co.pastoreando.app.dominio.ValidadorCredenciales;
import co.pastoreando.app.modelo.SesionIniciada;

/**
 * Pantalla de entrada: inicio de sesion con correo y contrasena. El servidor entrega el token y
 * el rol; segun el rol la pantalla de lotes muestra o esconde opciones. Si ya hay una sesion
 * abierta, pasa directo a los lotes.
 */
public class LoginActivity extends AppCompatActivity {

    private SesionLocal sesion;
    private TextInputLayout tilCorreo;
    private TextInputLayout tilClave;
    private TextInputEditText etCorreo;
    private TextInputEditText etClave;
    private Button btnIngresar;
    private ProgressBar progreso;
    private TextView tvError;
    private boolean enCurso;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        sesion = new SesionLocal(this);
        if (sesion.haySesion()) {
            irALotes();
            return;
        }
        setContentView(R.layout.activity_login);
        BordeABorde.aplicar(findViewById(R.id.raizLogin), null);

        tilCorreo = findViewById(R.id.tilCorreo);
        tilClave = findViewById(R.id.tilClave);
        etCorreo = findViewById(R.id.etCorreo);
        etClave = findViewById(R.id.etClave);
        btnIngresar = findViewById(R.id.btnIngresar);
        progreso = findViewById(R.id.progresoLogin);
        tvError = findViewById(R.id.tvErrorLogin);

        btnIngresar.setOnClickListener(vista -> intentarIngreso());
        etClave.setOnEditorActionListener((vista, accion, evento) -> {
            if (accion == EditorInfo.IME_ACTION_DONE) {
                intentarIngreso();
                return true;
            }
            return false;
        });
    }

    private void intentarIngreso() {
        if (enCurso) {
            return;
        }
        final String correo = texto(etCorreo);
        final String clave = etClave.getText() == null ? "" : etClave.getText().toString();

        ErrorValidacion errorCorreo = ValidadorCredenciales.validarCorreo(correo);
        ErrorValidacion errorClave = ValidadorCredenciales.validarClave(clave);
        tilCorreo.setError(errorCorreo == null ? null : getString(Textos.validacion(errorCorreo)));
        tilClave.setError(errorClave == null ? null : getString(Textos.validacion(errorClave)));
        if (errorCorreo != null || errorClave != null) {
            return;
        }

        mostrarCargando(true);
        TareaFondo.ejecutar(
                () -> Dependencias.autenticacion().iniciarSesion(correo, clave),
                new TareaFondo.Resultado<SesionIniciada>() {
                    @Override
                    public void alExito(SesionIniciada iniciada) {
                        if (isFinishing() || isDestroyed()) {
                            return;
                        }
                        sesion.guardar(iniciada);
                        etClave.setText("");
                        irALotes();
                    }

                    @Override
                    public void alError(ErrorApi error) {
                        if (isFinishing() || isDestroyed()) {
                            return;
                        }
                        mostrarCargando(false);
                        tvError.setText(Textos.errorInicioSesion(LoginActivity.this, error));
                        tvError.setVisibility(View.VISIBLE);
                    }
                });
    }

    private void mostrarCargando(boolean cargando) {
        enCurso = cargando;
        btnIngresar.setEnabled(!cargando);
        btnIngresar.setText(cargando ? R.string.ingresando : R.string.ingresar);
        progreso.setVisibility(cargando ? View.VISIBLE : View.GONE);
        if (cargando) {
            tvError.setVisibility(View.GONE);
        }
    }

    private void irALotes() {
        startActivity(new Intent(this, LotesActivity.class));
        finish();
    }

    private static String texto(TextInputEditText campo) {
        return campo.getText() == null ? "" : campo.getText().toString().trim();
    }
}
