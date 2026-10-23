// Monitoreo ambiental y sobrecarga (prototipo alerta_carga.html, RF04). Una tarjeta por lote con
// su aviso y sus sugerencias; usa los lotes guardados cuando no hay red.

import { Navigate, useLocation } from "react-router";
import AvisoNivel from "../componentes/AvisoNivel.jsx";
import Boton from "../componentes/Boton.jsx";
import IndicadorCarga from "../componentes/IndicadorCarga.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import PanelSugerencias from "../componentes/PanelSugerencias.jsx";
import TarjetaLote from "../componentes/TarjetaLote.jsx";
import { useLotes } from "../hooks/useLotes.js";

export default function PaginaMonitoreoCarga() {
  const { lotes, cargando, error, desdeCache, sinConexion, recargar } = useLotes();
  const ubicacion = useLocation();

  if (sinConexion) return <Navigate to="/sin-conexion" replace state={{ desde: ubicacion.pathname }} />;
  if (cargando && lotes.length === 0) return <IndicadorCarga etiqueta="Cargando los lotes" />;
  if (error) return <MensajeAviso tipo="error">{error.detalle ?? error.message}</MensajeAviso>;

  return (
    <section className="pagina">
      <h1 className="pagina__titulo">Monitoreo ambiental y sobrecarga</h1>
      <p className="pagina__ayuda">
        Seguimiento de la capacidad forrajera de {lotes.length === 1 ? "su lote" : `los ${lotes.length} lotes`}.
      </p>
      {desdeCache && (
        <MensajeAviso tipo="info">Datos guardados en este dispositivo. Se actualizarán al recuperar la conexión.</MensajeAviso>
      )}

      {lotes.length === 0 ? (
        <MensajeAviso tipo="info">Todavía no hay lotes registrados.</MensajeAviso>
      ) : (
        <div className="rejilla-lotes">
          {lotes.map((lote) => (
            <TarjetaLote key={lote.id_lote} lote={lote}>
              <AvisoNivel nivel={lote.estado_carga.nivel} mensaje={lote.estado_carga.mensaje} />
              <PanelSugerencias sugerencias={lote.estado_carga.sugerencias} />
            </TarjetaLote>
          ))}
        </div>
      )}
      <Boton variante="secundario" icono="refrescar" alHacerClic={recargar} cargando={cargando}>
        ACTUALIZAR
      </Boton>
    </section>
  );
}
