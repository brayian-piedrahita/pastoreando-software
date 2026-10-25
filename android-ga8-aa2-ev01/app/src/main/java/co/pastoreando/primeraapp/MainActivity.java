package co.pastoreando.primeraapp;

import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

/**
 * Pantalla principal de la primera aplicacion de Pastoreando.
 * Muestra un mensaje de bienvenida y, al pulsar el boton, informa la version de Android.
 */
public class MainActivity extends AppCompatActivity {

    private TextView tvMensaje;
    private Button btnSaludar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        tvMensaje = findViewById(R.id.tvMensaje);
        btnSaludar = findViewById(R.id.btnSaludar);

        btnSaludar.setOnClickListener(vista -> mostrarMensaje());
    }

    private void mostrarMensaje() {
        String detalle = getString(R.string.mensaje_dispositivo,
                Build.VERSION.RELEASE, Build.VERSION.SDK_INT);
        tvMensaje.setText(detalle);
        Toast.makeText(this, R.string.mensaje_toast, Toast.LENGTH_SHORT).show();
    }
}