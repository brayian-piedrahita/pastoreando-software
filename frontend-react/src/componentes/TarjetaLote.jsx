// Unidad de lectura de un lote: nombre, pastura, medidor, carga, capacidad y nivel. Lo que cada
// pantalla quiera agregar debajo (avisos, sugerencias) llega como children.

import { formatoNumero } from "../utilidades/formato.js";
import InsigniaNivel from "./InsigniaNivel.jsx";
import MedidorCarga from "./MedidorCarga.jsx";

export default function TarjetaLote({ lote, children }) {
  const { nombre_lote, tipo_pastura, hectareas, capacidad_carga, estado_carga } = lote;
  const sobrecarga = estado_carga.nivel === "SOBRECARGA";

  return (
    <article className={`tarjeta-lote${sobrecarga ? " tarjeta-lote--sobrecarga" : ""}`}>
      <h3 className="tarjeta-lote__titulo">
        {nombre_lote} <span>({tipo_pastura})</span>
      </h3>
      <MedidorCarga porcentaje={estado_carga.porcentaje} nivel={estado_carga.nivel} />
      <p className="tarjeta-lote__dato">
        Carga actual: <strong>{estado_carga.carga_actual}</strong> cabezas
      </p>
      <p className="tarjeta-lote__dato tarjeta-lote__dato--suave">Capacidad: {capacidad_carga} cabezas</p>
      <p className="tarjeta-lote__dato tarjeta-lote__dato--suave">{formatoNumero(hectareas)} hectáreas</p>
      <InsigniaNivel nivel={estado_carga.nivel} />
      {children}
    </article>
  );
}
