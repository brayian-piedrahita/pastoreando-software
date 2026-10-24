// Servicios de contratos y ganado: GET /api/contratos, el documento generado (RF05) y el registro
// del ganado de cada contrato. Cada funcion devuelve el JSON de la API sin transformarlo.

import { solicitar } from "./clienteApi.js";

export function listarContratos() {
  return solicitar("/api/contratos");
}

export function obtenerContrato(idContrato) {
  return solicitar(`/api/contratos/${idContrato}`);
}

/** Texto del contrato con su huella SHA-256 (falla con 409 si aun no hay ganado). */
export function obtenerDocumento(idContrato) {
  return solicitar(`/api/contratos/${idContrato}/documento`);
}

export function listarGanado(idContrato) {
  return solicitar(`/api/contratos/${idContrato}/ganado`);
}

/** Registra un hato. La respuesta incluye estado_carga: la alerta RF04 del lote. */
export function crearGanado(idContrato, valores) {
  return solicitar(`/api/contratos/${idContrato}/ganado`, {
    metodo: "POST",
    cuerpo: {
      raza: valores.raza.trim(),
      cantidad_cabezas: Number(valores.cantidad_cabezas),
      proposito: valores.proposito,
    },
  });
}

export function eliminarGanado(idGanado) {
  return solicitar(`/api/ganado/${idGanado}`, { metodo: "DELETE" });
}
