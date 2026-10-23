// Una fila del desglose: icono, nombre, descripcion y valor del rubro.

import Icono from "./Icono.jsx";

export default function FilaRubro({ icono, nombre, descripcion, valor, detalle }) {
  return (
    <li className="fila-rubro">
      <span className="fila-rubro__icono">
        <Icono nombre={icono} tamano={22} />
      </span>
      <span className="fila-rubro__texto">
        <strong>{nombre}</strong>
        <small>{descripcion}</small>
      </span>
      <span className="fila-rubro__valor">
        {valor}
        {detalle && <small>{detalle}</small>}
      </span>
    </li>
  );
}
