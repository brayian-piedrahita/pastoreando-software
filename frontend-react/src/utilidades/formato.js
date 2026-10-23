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
