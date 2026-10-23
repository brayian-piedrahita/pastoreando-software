// Datos de ejemplo con la misma forma que devuelve la API y un fetch simulado para las pruebas.

import { vi } from "vitest";

export const USUARIO_PROPIETARIO = {
  id_usuario: 1, nombre: "Carlos", apellidos: "Ramirez Soto", cedula: "10456789",
  rol: "Propietario", correo: "carlos.ramirez@pastoreando.co",
};
export const USUARIO_TECNICO = { ...USUARIO_PROPIETARIO, id_usuario: 3, nombre: "Laura", rol: "Tecnico" };

function estado(carga, capacidad, nivel, mensaje, sugerencias = []) {
  return {
    carga_actual: carga, capacidad_carga: capacidad,
    porcentaje: Math.round((carga * 1000) / capacidad) / 10,
    nivel, mensaje, excedente: Math.max(0, carga - capacidad), sugerencias,
  };
}

export const LOTES = [
  {
    id_lote: 1, id_propietario: 1, nombre_lote: "Potrero La Esperanza", hectareas: 12.5,
    capacidad_carga: 30, tipo_pastura: "Brachiaria",
    estado_carga: estado(26, 30, "ALERTA", "El lote está próximo a exceder su capacidad de carga.",
      ["Evitar nuevos ingresos de animales al lote."]),
  },
  {
    id_lote: 2, id_propietario: 1, nombre_lote: "Lote Alto El Mirador", hectareas: 8,
    capacidad_carga: 20, tipo_pastura: "Kikuyo",
    estado_carga: estado(24, 20, "SOBRECARGA", "¡Sobrecarga! El lote supera su capacidad en 4 cabeza(s).",
      ["Reubicar al menos 4 cabeza(s) en otro lote."]),
  },
  {
    id_lote: 3, id_propietario: 1, nombre_lote: "Lote Rio Frio", hectareas: 5.5,
    capacidad_carga: 12, tipo_pastura: "Kikuyo",
    estado_carga: estado(0, 12, "NORMAL", "Carga dentro de la capacidad del lote."),
  },
];

export const ESTRATEGIAS = [
  { proposito: "Carne", factor_manejo: 1.0, descripcion: "Sin recargo de manejo" },
  { proposito: "Leche", factor_manejo: 1.1, descripcion: "Recargo del 10 % por ordeño y sanidad" },
  { proposito: "Doble Proposito", factor_manejo: 1.05, descripcion: "Recargo del 5 % por manejo mixto" },
];

// Respuesta real de POST /api/costos/calcular con 12.000.000 de costos y 50 animales de carne.
export const CALCULO_CARNE = {
  proposito: "Carne", estrategia: "Sin recargo de manejo", cantidad_animales: 50,
  subtotal_lote: 12000000, costo_base_por_cabeza: 240000, factor_manejo: 1, ajuste_manejo: 0,
  margen_porcentaje: 20, margen_por_cabeza: 48000, costo_unitario_final: 288000, total_lote_final: 14400000,
  desglose: [
    { rubro: "Alimentación", valor_lote: 6000000, valor_por_cabeza: 120000, porcentaje: 50 },
    { rubro: "Mantenimiento", valor_lote: 3000000, valor_por_cabeza: 60000, porcentaje: 25 },
    { rubro: "Servicios", valor_lote: 1500000, valor_por_cabeza: 30000, porcentaje: 12.5 },
    { rubro: "Impuestos", valor_lote: 1500000, valor_por_cabeza: 30000, porcentaje: 12.5 },
  ],
  id_calculo: 2,
};

export const SESION_PROPIETARIO = { token: "token-de-prueba", usuario: USUARIO_PROPIETARIO };

/**
 * Reemplaza fetch por un simulador. `rutas` asocia "METODO /ruta" con una respuesta
 * { estado, cuerpo } o con una funcion que la calcula. Una ruta que no existe responde 404 y
 * `rutas.RED_CAIDA = true` hace que fetch falle como cuando no hay red.
 */
export function simularApi(rutas) {
  const fetchSimulado = vi.fn(async (url, opciones = {}) => {
    if (rutas.RED_CAIDA) throw new TypeError("Failed to fetch");
    const clave = `${opciones.method ?? "GET"} ${url}`;
    const entrada = rutas[clave];
    const respuesta = typeof entrada === "function" ? entrada(opciones) : entrada;
    const { estado = 200, cuerpo = {} } = respuesta ?? { estado: 404, cuerpo: { detalle: "No encontrado", campo: null } };
    return { ok: estado >= 200 && estado < 300, status: estado, json: async () => cuerpo };
  });
  vi.stubGlobal("fetch", fetchSimulado);
  return fetchSimulado;
}
