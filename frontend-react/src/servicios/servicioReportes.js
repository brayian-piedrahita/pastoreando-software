// Reporte de rentabilidad (RF06): ingresos, costo estimado, utilidad proyectada con margen del
// 20 % y recaudo de los contratos. Solo lo consultan el propietario y el contador.

import { solicitar } from "./clienteApi.js";

export function obtenerRentabilidad() {
  return solicitar("/api/reportes/rentabilidad");
}
