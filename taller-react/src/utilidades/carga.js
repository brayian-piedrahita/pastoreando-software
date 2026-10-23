// Regla de alerta de carga animal (RF04) que usan los ejemplos del taller.
// Se trabaja con enteros para evitar errores de redondeo con decimales.

export const ESTADOS_CARGA = Object.freeze({
  NORMAL: "NORMAL",
  ALERTA: "ALERTA",
  SOBRECARGA: "SOBRECARGA",
});

// Porcentaje desde el cual (por encima) el lote pasa a ALERTA
const UMBRAL_ALERTA = 80;
// Porcentaje a partir del cual (por encima) el lote esta en SOBRECARGA
const UMBRAL_SOBRECARGA = 100;

/**
 * Calcula el porcentaje de carga y el estado de un lote.
 * NORMAL hasta 80 %, ALERTA por encima de 80 % y hasta 100 %,
 * SOBRECARGA por encima de 100 %.
 *
 * @param {number} cabezas   cabezas de ganado que hay en el lote
 * @param {number} capacidad capacidad de carga del lote (mayor que cero)
 * @returns {{porcentaje: number, estado: string}}
 */
export function calcularEstadoCarga(cabezas, capacidad) {
  if (!Number.isInteger(cabezas) || cabezas < 0) {
    throw new RangeError("Las cabezas deben ser un entero mayor o igual a cero");
  }
  if (!Number.isInteger(capacidad) || capacidad <= 0) {
    throw new RangeError("La capacidad debe ser un entero mayor que cero");
  }

  const porcentaje = Math.round((cabezas * 100) / capacidad);

  let estado = ESTADOS_CARGA.NORMAL;
  if (cabezas * 100 > capacidad * UMBRAL_SOBRECARGA) {
    estado = ESTADOS_CARGA.SOBRECARGA;
  } else if (cabezas * 100 > capacidad * UMBRAL_ALERTA) {
    estado = ESTADOS_CARGA.ALERTA;
  }

  return { porcentaje, estado };
}
