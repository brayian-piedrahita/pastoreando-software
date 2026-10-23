// Resultado principal del calculo (RF01): se destaca y se aisla del resto de la pantalla.

import { formatoMoneda } from "../utilidades/formato.js";

export default function ResultadoCosto({ titulo, valor, nota }) {
  return (
    <section className="resultado-costo" aria-live="polite">
      <h3>{titulo}</h3>
      <p className="resultado-costo__valor">{valor === null ? "—" : formatoMoneda(valor)}</p>
      <p className="resultado-costo__nota">{nota}</p>
    </section>
  );
}
