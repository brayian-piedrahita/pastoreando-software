// Reportes financieros (RF06): ingresos, costo estimado, utilidad proyectada con el margen del
// proyecto y recaudo de cada contrato. Solo lo ven el propietario y el contador.

import { Navigate, useLocation } from "react-router";
import Boton from "../componentes/Boton.jsx";
import IndicadorCarga from "../componentes/IndicadorCarga.jsx";
import InsigniaEstado from "../componentes/InsigniaEstado.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import TarjetaIndicador from "../componentes/TarjetaIndicador.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import { CLAVES } from "../servicios/almacenLocal.js";
import { obtenerRentabilidad } from "../servicios/servicioReportes.js";
import { formatoMoneda, formatoPorcentaje } from "../utilidades/formato.js";

export default function PaginaReportes() {
  const { datos, cargando, error, desdeCache, sinConexion, recargar } = useConsulta(obtenerRentabilidad, {
    clave: CLAVES.REPORTE,
  });
  const ubicacion = useLocation();

  if (sinConexion) return <Navigate to="/sin-conexion" replace state={{ desde: ubicacion.pathname }} />;
  if (cargando && !datos) return <IndicadorCarga etiqueta="Cargando el reporte" />;
  if (error) return <MensajeAviso tipo="error">{error.detalle ?? error.message}</MensajeAviso>;

  const { contratos, totales, margen_utilidad: margen } = datos;

  return (
    <section className="pagina">
      <h1 className="pagina__titulo">Reportes financieros</h1>
      <p className="pagina__ayuda">
        Proyección de rentabilidad con un margen de {formatoPorcentaje(margen * 100)} sobre el costo estimado.
      </p>
      {desdeCache && (
        <MensajeAviso tipo="info">Datos guardados en este dispositivo. Se actualizarán al recuperar la conexión.</MensajeAviso>
      )}

      <div className="indicadores indicadores--cuatro">
        <TarjetaIndicador icono="moneda" valor={formatoMoneda(totales.ingreso_total)} etiqueta="Ingreso total" color="verde" />
        <TarjetaIndicador icono="recibo" valor={formatoMoneda(totales.costo_estimado)} etiqueta="Costo estimado" color="gris" />
        <TarjetaIndicador icono="grafica" valor={formatoMoneda(totales.utilidad_proyectada)} etiqueta="Utilidad proyectada" color="verde-claro" />
        <TarjetaIndicador icono="tarjeta" valor={formatoMoneda(totales.saldo_por_cobrar)} etiqueta="Saldo por cobrar" color="naranja" />
      </div>

      {contratos.length === 0 ? (
        <MensajeAviso tipo="info">Todavía no hay contratos para reportar.</MensajeAviso>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <caption className="solo-lectores">Rentabilidad por contrato</caption>
            <thead>
              <tr>
                <th scope="col">Contrato</th>
                <th scope="col">Estado</th>
                <th scope="col">Cabezas</th>
                <th scope="col">Ingreso</th>
                <th scope="col">Costo estimado</th>
                <th scope="col">Utilidad</th>
                <th scope="col">Recaudado</th>
                <th scope="col">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => (
                <tr key={c.id_contrato}>
                  <th scope="row">{c.nombre_lote}</th>
                  <td>
                    <InsigniaEstado estado={c.estado} />
                  </td>
                  <td className="tabla__numero">{c.total_cabezas}</td>
                  <td className="tabla__numero">{formatoMoneda(c.ingreso_total)}</td>
                  <td className="tabla__numero">{formatoMoneda(c.costo_estimado)}</td>
                  <td className="tabla__numero">{formatoMoneda(c.utilidad_proyectada)}</td>
                  <td className="tabla__numero">{formatoMoneda(c.recaudado)}</td>
                  <td className="tabla__numero">{formatoMoneda(c.saldo_por_cobrar)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>Totales</th>
                <td className="tabla__numero">{formatoMoneda(totales.ingreso_total)}</td>
                <td className="tabla__numero">{formatoMoneda(totales.costo_estimado)}</td>
                <td className="tabla__numero">{formatoMoneda(totales.utilidad_proyectada)}</td>
                <td className="tabla__numero">{formatoMoneda(totales.recaudado)}</td>
                <td className="tabla__numero">{formatoMoneda(totales.saldo_por_cobrar)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <Boton variante="secundario" icono="refrescar" alHacerClic={recargar} cargando={cargando}>
        ACTUALIZAR
      </Boton>
    </section>
  );
}
