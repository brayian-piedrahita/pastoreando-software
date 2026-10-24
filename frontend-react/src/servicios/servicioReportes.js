// Reporte de rentabilidad (RF06): ingresos, costo estimado, utilidad proyectada con margen del
// 20 % y recaudo de los contratos. Solo lo consultan el propietario y el contador.

import { solicitar, solicitarArchivo } from "./clienteApi.js";

export function obtenerRentabilidad() {
  return solicitar("/api/reportes/rentabilidad");
}

// Descarga el mismo reporte como "pdf" o "excel". Devuelve el archivo y el nombre propuesto.
export function descargarReporte(formato) {
  return solicitarArchivo(`/api/reportes/rentabilidad/${formato}`);
}
