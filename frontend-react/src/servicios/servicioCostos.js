// Servicios de costos: POST /api/costos/calcular (RF01 y RF02) y GET /api/costos/estrategias.

import { solicitar } from "./clienteApi.js";

/** Convierte los textos del formulario en numeros y pide el calculo a la API. */
export function calcularCosto(valores) {
  return solicitar("/api/costos/calcular", {
    metodo: "POST",
    cuerpo: {
      alimentacion: Number(valores.alimentacion),
      mantenimiento: Number(valores.mantenimiento),
      servicios: Number(valores.servicios),
      impuestos: Number(valores.impuestos),
      cantidad_animales: Number(valores.cantidad_animales),
      proposito: valores.proposito,
    },
  });
}

/** Propositos disponibles con su factor de manejo (patron Strategy del backend). */
export function listarEstrategias() {
  return solicitar("/api/costos/estrategias");
}
