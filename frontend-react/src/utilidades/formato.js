// Formato de cifras para la interfaz. Se centraliza para que todas las pantallas
// muestren los valores igual: moneda colombiana con dos decimales y porcentajes con coma.

const MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMERO = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

// Devuelve, por ejemplo, "$ 288.000,00". Intl usa un espacio duro que se cambia
// por uno normal para que el texto se pueda comparar y copiar sin sorpresas.
export function formatoMoneda(valor) {
  if (!Number.isFinite(valor)) return "—";
  return MONEDA.format(valor).replace(/ /g, " ");
}

// Devuelve, por ejemplo, "86,7 %" o "120 %".
export function formatoPorcentaje(valor) {
  if (!Number.isFinite(valor)) return "—";
  return `${NUMERO.format(valor)} %`;
}

// Devuelve un numero con separador de miles y hasta un decimal: "12,5".
export function formatoNumero(valor) {
  if (!Number.isFinite(valor)) return "—";
  return NUMERO.format(valor);
}

// Devuelve "1 de octubre de 2026" a partir de "2026-10-01". Se arma con la fecha local a
// mediodia para que el cambio de zona horaria no corra el dia.
export function formatoFecha(texto) {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(texto)) return "—";
  const [anio, mes, dia] = texto.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(anio, mes - 1, dia, 12));
}

// Devuelve "1 de octubre de 2026, 3:05 p. m." a partir de "2026-10-01T15:05:00".
export function formatoFechaHora(texto) {
  if (typeof texto !== "string" || !texto.includes("T")) return formatoFecha(texto);
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short" }).format(fecha);
}
