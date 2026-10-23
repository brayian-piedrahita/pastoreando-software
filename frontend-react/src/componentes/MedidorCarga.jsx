// Circulo SVG con el porcentaje de carga al centro. El color sale del nivel que calcula la API
// (NORMAL verde, ALERTA naranja, SOBRECARGA rojo), no se pasa a mano.

import { formatoPorcentaje } from "../utilidades/formato.js";

const CLASE_POR_NIVEL = { NORMAL: "verde", ALERTA: "naranja", SOBRECARGA: "rojo" };
const TRAZO_CIRCULO = "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

export default function MedidorCarga({ porcentaje, nivel }) {
  const color = CLASE_POR_NIVEL[nivel] ?? "verde";
  // El circulo se llena como maximo al 100 %; el texto si muestra el valor real (por ejemplo 120 %).
  const relleno = Math.max(0, Math.min(porcentaje, 100));

  return (
    <svg
      viewBox="0 0 36 36"
      className={`medidor medidor--${color}`}
      role="img"
      aria-label={`Carga del lote: ${formatoPorcentaje(porcentaje)}`}
    >
      <path className="medidor__fondo" d={TRAZO_CIRCULO} />
      <path className="medidor__trazo" strokeDasharray={`${relleno}, 100`} d={TRAZO_CIRCULO} />
      <text x="18" y="20.35" className="medidor__texto">
        {formatoPorcentaje(porcentaje)}
      </text>
    </svg>
  );
}
