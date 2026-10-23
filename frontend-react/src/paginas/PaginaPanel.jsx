// Panel de control (prototipo index.html): cuatro indicadores del conjunto de lotes y los lotes
// que requieren atencion. Los datos salen de GET /api/lotes (o de la copia local sin red).

import { Link, Navigate, useLocation } from "react-router";
import AvisoNivel from "../componentes/AvisoNivel.jsx";
import IndicadorCarga from "../componentes/IndicadorCarga.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import TarjetaIndicador from "../componentes/TarjetaIndicador.jsx";
import TarjetaLote from "../componentes/TarjetaLote.jsx";
import { useLotes } from "../hooks/useLotes.js";
import { formatoNumero } from "../utilidades/formato.js";

// Margen de rentabilidad proyectado que define el proyecto (RF06).
const MARGEN_PROYECTADO = "+20 %";

export default function PaginaPanel() {
  const { lotes, cargando, error, desdeCache, sinConexion } = useLotes();
  const ubicacion = useLocation();

  if (sinConexion) return <Navigate to="/sin-conexion" replace state={{ desde: ubicacion.pathname }} />;
  if (cargando && lotes.length === 0) return <IndicadorCarga etiqueta="Cargando el panel" />;
  if (error) return <MensajeAviso tipo="error">{error.detalle ?? error.message}</MensajeAviso>;

  const hectareas = lotes.reduce((suma, lote) => suma + lote.hectareas, 0);
  const cabezas = lotes.reduce((suma, lote) => suma + lote.estado_carga.carga_actual, 0);
  const requierenAtencion = lotes.filter((lote) => lote.estado_carga.nivel !== "NORMAL");

  return (
    <section className="pagina">
      <h1 className="pagina__titulo">Panel de control</h1>
      {desdeCache && (
        <MensajeAviso tipo="info">Datos guardados en este dispositivo. Se actualizarán al recuperar la conexión.</MensajeAviso>
      )}

      <div className="indicadores">
        <TarjetaIndicador icono="terreno" valor={`${formatoNumero(hectareas)} ha`} etiqueta="Área total" color="verde-claro" />
        <TarjetaIndicador icono="animal" valor={cabezas} etiqueta="Cabezas en los lotes" color="verde" />
        <TarjetaIndicador icono="alerta" valor={requierenAtencion.length} etiqueta="Lotes en alerta o sobrecarga"
          color={requierenAtencion.length > 0 ? "naranja" : "verde"} />
        <TarjetaIndicador icono="moneda" valor={MARGEN_PROYECTADO} etiqueta="Margen de rentabilidad" color="gris" />
      </div>

      <h2 className="pagina__subtitulo">Lotes que requieren atención</h2>
      {requierenAtencion.length === 0 ? (
        <MensajeAviso tipo="exito">Todos los lotes están dentro de su capacidad de carga.</MensajeAviso>
      ) : (
        <div className="rejilla-lotes">
          {requierenAtencion.map((lote) => (
            <TarjetaLote key={lote.id_lote} lote={lote}>
              <AvisoNivel nivel={lote.estado_carga.nivel} mensaje={lote.estado_carga.mensaje} />
            </TarjetaLote>
          ))}
        </div>
      )}
      <p>
        <Link to="/monitoreo">Ver el monitoreo completo</Link>
      </p>
    </section>
  );
}
