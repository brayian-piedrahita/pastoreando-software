// Servicio de lotes: GET /api/lotes. Cada lote incluye estado_carga, calculado por la API
// con la regla RF04 (NORMAL, ALERTA, SOBRECARGA), asi la interfaz no duplica la regla.

import { solicitar } from "./clienteApi.js";

export function listarLotes() {
  return solicitar("/api/lotes");
}
