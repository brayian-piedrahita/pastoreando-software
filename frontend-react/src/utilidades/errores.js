// Convierte el error de una accion (guardar, firmar, resolver) en un texto para el usuario. Los
// errores de la API traen su propio mensaje; sin red se explica que la accion necesita conexion.

import { ErrorApi, ErrorRed } from "../servicios/clienteApi.js";

export function mensajeDeError(error) {
  if (error instanceof ErrorApi) return error.detalle;
  if (error instanceof ErrorRed) {
    return "No hay conexión con el servidor. Esta acción necesita red; intente de nuevo cuando la recupere.";
  }
  throw error;
}
