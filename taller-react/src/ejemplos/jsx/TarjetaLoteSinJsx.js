// La misma tarjeta de TarjetaLote.jsx, escrita sin JSX.
// React solo necesita elementos; JSX es una forma mas comoda de crearlos.
import { createElement } from "react";

export function TarjetaLoteSinJsx({ nombre, hectareas, estado }) {
  return createElement(
    "article",
    { className: "tarjeta-lote" },
    createElement("h3", null, nombre),
    createElement("p", null, hectareas, " ha"),
    createElement(
      "span",
      { className: `insignia insignia-${estado.toLowerCase()}` },
      estado,
    ),
  );
}
