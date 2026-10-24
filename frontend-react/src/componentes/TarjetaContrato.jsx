// Resumen de un contrato en la lista: lote, partes, vigencia y valores. Enlaza al detalle, donde
// estan el ganado, la firma, los pagos y las recomendaciones.

import { Link } from "react-router";
import { formatoFecha, formatoMoneda } from "../utilidades/formato.js";
import InsigniaEstado from "./InsigniaEstado.jsx";

export default function TarjetaContrato({ contrato }) {
  const {
    id_contrato, nombre_lote, nombre_propietario, nombre_arrendatario, fecha_inicio, fecha_fin,
    meses_duracion, total_cabezas, valor_mensual, valor_total, estado,
  } = contrato;

  return (
    <article className="tarjeta-contrato">
      <h3 className="tarjeta-contrato__titulo">
        Contrato {String(id_contrato).padStart(4, "0")} · {nombre_lote}
      </h3>
      <InsigniaEstado estado={estado} />
      <dl className="datos">
        <div>
          <dt>Propietario</dt>
          <dd>{nombre_propietario}</dd>
        </div>
        <div>
          <dt>Arrendatario</dt>
          <dd>{nombre_arrendatario}</dd>
        </div>
        <div>
          <dt>Vigencia</dt>
          <dd>
            {formatoFecha(fecha_inicio)} al {formatoFecha(fecha_fin)} ({meses_duracion} meses)
          </dd>
        </div>
        <div>
          <dt>Cabezas</dt>
          <dd>{total_cabezas}</dd>
        </div>
        <div>
          <dt>Valor mensual</dt>
          <dd>{formatoMoneda(valor_mensual)}</dd>
        </div>
        <div>
          <dt>Valor total</dt>
          <dd>{formatoMoneda(valor_total)}</dd>
        </div>
      </dl>
      <Link className="boton boton--secundario tarjeta-contrato__enlace" to={`/contratos/${id_contrato}`}>
        <span>VER DETALLE</span>
      </Link>
    </article>
  );
}
