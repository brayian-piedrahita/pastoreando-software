// Servicios de recomendaciones tecnicas sobre un hato: las escribe el tecnico y las leen quienes
// ven el contrato.

import { solicitar } from "./clienteApi.js";

export function listarRecomendaciones(idGanado) {
  return solicitar(`/api/ganado/${idGanado}/recomendaciones`);
}

export function crearRecomendacion(idGanado, descripcion) {
  return solicitar(`/api/ganado/${idGanado}/recomendaciones`, {
    metodo: "POST",
    cuerpo: { descripcion: descripcion.trim() },
  });
}

export function eliminarRecomendacion(idRecomendacion) {
  return solicitar(`/api/recomendaciones/${idRecomendacion}`, { metodo: "DELETE" });
}
