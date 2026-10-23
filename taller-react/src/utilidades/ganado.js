// Validaciones del registro de ganado (tabla GANADO del modelo de datos).

// Valores que acepta el servicio para el proposito del hato
export const PROPOSITOS = Object.freeze(["Carne", "Leche", "Doble Proposito"]);

// Texto que se muestra al usuario para cada proposito
export const ETIQUETAS_PROPOSITO = Object.freeze({
  Carne: "Carne",
  Leche: "Leche",
  "Doble Proposito": "Doble propósito",
});

const LARGO_MINIMO_RAZA = 2;
const LARGO_MAXIMO_RAZA = 50;
// Solo letras (de cualquier idioma) y espacios
const PATRON_RAZA = /^[\p{L} ]+$/u;

/**
 * Valida los datos del formulario de ganado.
 * Devuelve un objeto con un mensaje por cada campo invalido;
 * si todo es correcto devuelve un objeto vacio.
 *
 * @param {{raza: string, cantidadCabezas: string|number, proposito: string}} datos
 * @returns {Object<string, string>}
 */
export function validarGanado({ raza, cantidadCabezas, proposito }) {
  const errores = {};

  const razaLimpia = String(raza ?? "").trim();
  if (razaLimpia.length < LARGO_MINIMO_RAZA || razaLimpia.length > LARGO_MAXIMO_RAZA) {
    errores.raza = "La raza debe tener entre 2 y 50 caracteres";
  } else if (!PATRON_RAZA.test(razaLimpia)) {
    errores.raza = "La raza solo admite letras y espacios";
  }

  const cantidad = Number(cantidadCabezas);
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    errores.cantidadCabezas = "La cantidad de cabezas debe ser un entero mayor que cero";
  }

  if (!PROPOSITOS.includes(proposito)) {
    errores.proposito = "Seleccione el propósito del hato";
  }

  return errores;
}
