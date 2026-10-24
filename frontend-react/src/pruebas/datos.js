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

// ---- Contratos, ganado, firma, pagos, recomendaciones y reportes (misma forma que la API) ----

export const USUARIO_ARRENDATARIO = {
  id_usuario: 2, nombre: "Brayian", apellidos: "Piedrahita Cortes", cedula: "1088765432",
  rol: "Arrendatario", correo: "brayian.piedrahita@pastoreando.co",
};
export const USUARIO_CONTADOR = { ...USUARIO_PROPIETARIO, id_usuario: 4, nombre: "Sandra", rol: "Contador" };

export const sesionDe = (usuario) => ({ token: "token-de-prueba", usuario });

export const CONTRATO_1 = {
  id_contrato: 1, id_lote: 1, nombre_lote: "Potrero La Esperanza", id_arrendatario: 2,
  nombre_arrendatario: "Brayian Piedrahita Cortes", nombre_propietario: "Carlos Ramirez Soto",
  fecha_inicio: "2026-10-01", fecha_fin: "2027-04-01", meses_duracion: 6, tarifa_por_cabeza: 85000,
  estado: "Activo", total_cabezas: 26, valor_mensual: 2210000, valor_total: 13260000,
};
export const CONTRATO_4 = {
  ...CONTRATO_1, id_contrato: 4, id_lote: 4, nombre_lote: "Lote Rio Frio", estado: "Finalizado",
  total_cabezas: 6, valor_mensual: 510000, valor_total: 1710000,
};
export const CONTRATOS = [CONTRATO_1, CONTRATO_4];

export const GANADO = [
  { id_ganado: 1, id_contrato: 1, raza: "Brahman", cantidad_cabezas: 8, proposito: "Carne" },
  { id_ganado: 5, id_contrato: 1, raza: "Girolando", cantidad_cabezas: 3, proposito: "Doble Proposito" },
];

export const RECOMENDACIONES = [
  {
    id_recomendacion: 1, id_ganado: 1, id_zootecnista: 3, nombre_tecnico: "Laura Gomez Duque",
    fecha_recomendacion: "2026-10-05", descripcion: "Rotar el hato cada 15 dias para recuperar el pasto.",
  },
];

export const PAGOS = [
  { id_pago: 1, id_contrato: 1, fecha_pago: "2026-10-01", monto_total: 2210000, metodo_pago: "Transferencia", estado_pago: "Confirmado" },
  { id_pago: 2, id_contrato: 1, fecha_pago: "2026-11-01", monto_total: 2210000, metodo_pago: "Consignacion", estado_pago: "Pendiente" },
];

export const HUELLA = "7b523682c1bf004bef52befca1699b50aedcada06737f23301902ef27c90f92c";
export const DOCUMENTO = {
  id_contrato: 1,
  texto: "CONTRATO DE ARRENDAMIENTO GANADERO No. 0001\n\nPROPIETARIO: Carlos Ramirez Soto",
  huella_sha256: HUELLA,
};
export const SIN_FIRMAS = { id_contrato: 1, huella_actual: HUELLA, firmas: [], firmado_por_ambas_partes: false };
export const FIRMA_PROPIETARIO = {
  id_firma: 1, id_usuario: 1, nombre_firmante: "Carlos Ramirez Soto", rol_firmante: "Propietario",
  fecha_firma: "2026-10-24T09:15:00", huella_documento: HUELLA, vigente: true,
};

export const REPORTE = {
  margen_utilidad: 0.2,
  contratos: [
    { id_contrato: 1, nombre_lote: "Potrero La Esperanza", estado: "Activo", total_cabezas: 26,
      ingreso_total: 13260000, costo_estimado: 11050000, utilidad_proyectada: 2210000, recaudado: 2210000, saldo_por_cobrar: 11050000 },
    { id_contrato: 2, nombre_lote: "Lote Alto El Mirador", estado: "Activo", total_cabezas: 24,
      ingreso_total: 8640000, costo_estimado: 7200000, utilidad_proyectada: 1440000, recaudado: 2160000, saldo_por_cobrar: 6480000 },
  ],
  totales: { ingreso_total: 21900000, costo_estimado: 18250000, utilidad_proyectada: 3650000, recaudado: 4370000, saldo_por_cobrar: 17530000 },
};

/** Rutas de la API con datos normales para el detalle del contrato 1. */
export function rutasContrato1(extra = {}) {
  return {
    "GET /api/contratos": { cuerpo: CONTRATOS },
    "GET /api/contratos/1": { cuerpo: CONTRATO_1 },
    "GET /api/contratos/1/ganado": { cuerpo: GANADO },
    "GET /api/contratos/1/documento": { cuerpo: DOCUMENTO },
    "GET /api/contratos/1/firmas": { cuerpo: SIN_FIRMAS },
    "GET /api/contratos/1/pagos": { cuerpo: PAGOS },
    "GET /api/ganado/1/recomendaciones": { cuerpo: RECOMENDACIONES },
    "GET /api/ganado/5/recomendaciones": { cuerpo: [] },
    "GET /api/reportes/rentabilidad": { cuerpo: REPORTE },
    "GET /api/lotes": { cuerpo: LOTES },
    ...extra,
  };
}
