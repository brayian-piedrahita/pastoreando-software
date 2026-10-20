/**
 * Cliente de la API de Pastoreando.
 * Guarda el token de sesion y traduce las respuestas de error a mensajes.
 */
const CLAVE_SESION = 'pastoreando.sesion';

/**
 * Lee la sesion guardada en este navegador.
 * @returns {{token: string, usuario: object}|null}
 */
function leerSesion() {
  try {
    const texto = sessionStorage.getItem(CLAVE_SESION);
    return texto ? JSON.parse(texto) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Guarda o borra la sesion actual.
 * @param {object|null} sesion Datos devueltos por el login, o null para cerrar.
 */
function guardarSesion(sesion) {
  try {
    if (sesion) {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } else {
      sessionStorage.removeItem(CLAVE_SESION);
    }
  } catch (error) {
    // Sin almacenamiento disponible: la sesion vive solo en esta pagina.
  }
}

/**
 * Error de la API con el campo al que se refiere, si lo hay.
 */
class ErrorApi extends Error {
  /**
   * @param {string} mensaje Texto para mostrar al usuario.
   * @param {number} estado Codigo HTTP (0 si no hubo respuesta).
   * @param {string|null} campo Nombre del campo con problema.
   */
  constructor(mensaje, estado, campo) {
    super(mensaje);
    this.estado = estado;
    this.campo = campo || null;
  }
}

/**
 * Envia una solicitud a la API.
 * @param {string} metodo GET, POST, PUT o DELETE.
 * @param {string} ruta Ruta que empieza por /api.
 * @param {object} [cuerpo] Datos a enviar como JSON.
 * @returns {Promise<any>} Respuesta ya convertida desde JSON (null si no hay).
 */
async function solicitar(metodo, ruta, cuerpo) {
  const cabeceras = { 'Content-Type': 'application/json' };
  const sesion = leerSesion();
  if (sesion) {
    cabeceras.Authorization = `Bearer ${sesion.token}`;
  }
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    });
  } catch (error) {
    throw new ErrorApi('Sin conexión con el servidor. Intente de nuevo cuando recupere la señal.', 0);
  }
  if (respuesta.status === 204) {
    return null;
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ErrorApi(datos.detalle || 'Error inesperado', respuesta.status, datos.campo);
  }
  return datos;
}

/**
 * Registra el service worker para que la app abra sin internet.
 */
function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

/**
 * Muestra u oculta el banner rojo de "sin conexion".
 */
function vigilarConexion() {
  const banner = document.getElementById('bannerOffline');
  if (!banner) {
    return;
  }
  const actualizar = () => banner.classList.toggle('visible', !navigator.onLine);
  window.addEventListener('online', actualizar);
  window.addEventListener('offline', actualizar);
  actualizar();
}
