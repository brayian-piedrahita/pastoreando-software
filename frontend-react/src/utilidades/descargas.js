// Entrega un archivo al usuario: crea un enlace temporal al contenido y lo "pulsa" para que el
// navegador lo guarde con el nombre indicado.

export function guardarArchivo(blob, nombre) {
  const direccion = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = direccion;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(direccion);
}
