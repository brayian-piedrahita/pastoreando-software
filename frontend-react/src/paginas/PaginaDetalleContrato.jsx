// Detalle de un contrato: resumen con valores calculados y, debajo, los modulos que dependen de el
// (ganado y recomendaciones, documento y firma, pagos). Cuando cambia el ganado se vuelve a
// pedir el contrato y el documento, porque el texto firmado depende de las cabezas.

import { useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import IndicadorCarga from "../componentes/IndicadorCarga.jsx";
import InsigniaEstado from "../componentes/InsigniaEstado.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import SeccionFirma from "../componentes/SeccionFirma.jsx";
import SeccionGanado from "../componentes/SeccionGanado.jsx";
import SeccionPagos from "../componentes/SeccionPagos.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import { obtenerContrato } from "../servicios/servicioContratos.js";
import { formatoFecha, formatoMoneda } from "../utilidades/formato.js";

export default function PaginaDetalleContrato() {
  const { idContrato } = useParams();
  const [version, setVersion] = useState(0);
  const { datos, cargando, error, sinConexion, recargar } = useConsulta(() => obtenerContrato(idContrato), {
    dependencias: [idContrato],
  });
  const ubicacion = useLocation();

  const alCambiar = () => {
    setVersion((v) => v + 1);
    recargar();
  };

  if (sinConexion) return <Navigate to="/sin-conexion" replace state={{ desde: ubicacion.pathname }} />;
  if (cargando && !datos) return <IndicadorCarga etiqueta="Cargando el contrato" />;
  if (error) {
    return (
      <section className="pagina">
        <MensajeAviso tipo="error">{error.detalle ?? error.message}</MensajeAviso>
        <p>
          <Link to="/contratos">Volver a los contratos</Link>
        </p>
      </section>
    );
  }

  const activo = datos.estado === "Activo";

  return (
    <section className="pagina">
      <p>
        <Link to="/contratos">← Contratos</Link>
      </p>
      <h1 className="pagina__titulo">
        Contrato {String(datos.id_contrato).padStart(4, "0")} · {datos.nombre_lote}
      </h1>
      <InsigniaEstado estado={datos.estado} />
      <dl className="datos">
        <div>
          <dt>Propietario</dt>
          <dd>{datos.nombre_propietario}</dd>
        </div>
        <div>
          <dt>Arrendatario</dt>
          <dd>{datos.nombre_arrendatario}</dd>
        </div>
        <div>
          <dt>Vigencia</dt>
          <dd>
            {formatoFecha(datos.fecha_inicio)} al {formatoFecha(datos.fecha_fin)} ({datos.meses_duracion} meses)
          </dd>
        </div>
        <div>
          <dt>Tarifa por cabeza</dt>
          <dd>{formatoMoneda(datos.tarifa_por_cabeza)}</dd>
        </div>
        <div>
          <dt>Cabezas</dt>
          <dd>{datos.total_cabezas}</dd>
        </div>
        <div>
          <dt>Valor mensual</dt>
          <dd>{formatoMoneda(datos.valor_mensual)}</dd>
        </div>
        <div>
          <dt>Valor total</dt>
          <dd>{formatoMoneda(datos.valor_total)}</dd>
        </div>
      </dl>

      <SeccionGanado idContrato={idContrato} contratoActivo={activo} alCambiar={alCambiar} />
      <SeccionFirma idContrato={idContrato} contratoActivo={activo} version={version} />
      <SeccionPagos idContrato={idContrato} contratoActivo={activo} />
    </section>
  );
}
