// Cliente unico de la API de Pastoreando. Es la unica capa que conoce la URL base, la cabecera
// de autorizacion y el formato de error de la API: { detalle, campo }.

import { CLAVES, borrar, leer } from "./almacenLocal.js";

// En desarrollo se deja vacia: Vite reenvia /api al servidor FastAPI (ver vite.config.js).
// En produccion puede apuntar a otra direccion con VITE_API_URL.
const URL_BASE = import.meta.env?.VITE_API_URL ?? "";

export const EVENTO_SESION_EXPIRADA = "pastoreando:sesion-expirada";

// La API respondio con un error (4xx o 5xx).
export class ErrorApi extends Error {
  constructor(estado, detalle, campo = null) {
    super(detalle);
    this.name = "ErrorApi";
    this.estado = estado;
    this.detalle = detalle;
    this.campo = campo;
  }
}

// No hubo respuesta: sin red, servidor apagado o cortado a mitad de camino.
export class ErrorRed extends Error {
  constructor(mensaje = "No hay conexión con el servidor") {
    super(mensaje);
    this.name = "ErrorRed";
  }
}

/**
 * Hace una solicitud JSON a la API.
 *
 * @param {string} ruta ruta que empieza por /api
 * @param {{metodo?: string, cuerpo?: object, conSesion?: boolean}} opciones
 * @returns {Promise<any>} el cuerpo JSON de la respuesta
 * @throws {ErrorRed|ErrorApi}
 */
export async function solicitar(ruta, { metodo = "GET", cuerpo, conSesion = true } = {}) {
  const sesion = conSesion ? leer(CLAVES.SESION) : null;

  const cabeceras = { Accept: "application/json" };
  if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  if (sesion?.token) cabeceras.Authorization = `Bearer ${sesion.token}`;

  let respuesta;
  try {
    respuesta = await fetch(URL_BASE + ruta, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorRed();
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    // Un 401 con token enviado significa sesion vencida (el JWT dura 1 hora): se avisa a la
    // aplicacion para que cierre la sesion y lleve al inicio de sesion.
    if (respuesta.status === 401 && sesion?.token) {
      borrar(CLAVES.SESION);
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    throw new ErrorApi(
      respuesta.status,
      datos?.detalle ?? "Ocurrió un error inesperado. Intente de nuevo.",
      datos?.campo ?? null,
    );
  }

  return datos;
}
