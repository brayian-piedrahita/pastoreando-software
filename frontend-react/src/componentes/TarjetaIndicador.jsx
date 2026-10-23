// Tarjeta con un indicador del panel: icono, valor grande y etiqueta.

import Icono from "./Icono.jsx";

export default function TarjetaIndicador({ icono, valor, etiqueta, color = "verde" }) {
  return (
    <article className={`indicador indicador--${color}`}>
      <Icono nombre={icono} tamano={32} />
      <strong className="indicador__valor">{valor}</strong>
      <span className="indicador__etiqueta">{etiqueta}</span>
    </article>
  );
}
