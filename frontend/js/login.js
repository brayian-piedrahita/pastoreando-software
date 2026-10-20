/**
 * Pantalla de inicio de sesion.
 */
const formulario = document.getElementById('formLogin');
const campoCorreo = document.getElementById('correo');
const campoClave = document.getElementById('contrasena');
const mensajeError = document.getElementById('mensajeLogin');
const botonEntrar = document.getElementById('botonEntrar');

/**
 * Valida el formato antes de llamar al servidor.
 * @returns {string} Mensaje de error, o cadena vacia si todo esta bien.
 */
function validarFormulario() {
  const correo = campoCorreo.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(correo)) {
    return 'Ingrese un correo válido.';
  }
  if (campoClave.value.length === 0) {
    return 'Ingrese la contraseña.';
  }
  return '';
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensajeError.textContent = validarFormulario();
  if (mensajeError.textContent) {
    return;
  }
  botonEntrar.disabled = true;
  try {
    const sesion = await solicitar('POST', '/api/auth/login', {
      correo: campoCorreo.value.trim(),
      contrasena: campoClave.value
    });
    guardarSesion(sesion);
    window.location.href = '/panel.html';
  } catch (error) {
    mensajeError.textContent = error.message;
    botonEntrar.disabled = false;
  }
});

registrarServiceWorker();
vigilarConexion();
if (leerSesion()) {
  window.location.href = '/panel.html';
}
