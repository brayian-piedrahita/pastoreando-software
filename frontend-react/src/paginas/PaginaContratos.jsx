// Contratos de arrendamiento (RF05). Lista los que ve el rol del usuario y enlaza al detalle de
// cada uno. Usa la copia guardada cuando no hay red (RNF01).

import { Navigate, useLocation } from "react-router";
import Boton from "../componentes/Boton.jsx";
import IndicadorCarga from "../componentes/IndicadorCarga.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import TarjetaContrato from "../componentes/TarjetaContrato.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import { CLAVES } from "../servicios/almacenLocal.js";
import { listarContratos } from "../servicios/servicioContratos.js";

export default function PaginaContratos() {
  const { datos, cargando, error, desdeCache, sinConexion, recargar } = useConsulta(listarContratos, {
    clave: CLAVES.CONTRATOS,
  });
  const ubicacion = useLocation();

  if (sinConexion) return <Navigate to="/sin-conexion" replace state={{ desde: ubicacion.pathname }} />;
  if (cargando && !datos) return <IndicadorCarga etiqueta="Cargando los contratos" />;
  if (error) return <MensajeAviso tipo="error">{error.detalle ?? error.message}</MensajeAviso>;

  return (
    <section className="pagina">
      <h1 className="pagina__titulo">Contratos de arrendamiento</h1>
      <p className="pagina__ayuda">
        {datos.length === 1 ? "Su contrato" : `Sus ${datos.length} contratos`}, con el ganado, la firma, los pagos y
        las recomendaciones de cada uno.
      </p>
      {desdeCache && (
        <MensajeAviso tipo="info">Datos guardados en este dispositivo. Se actualizarán al recuperar la conexión.</MensajeAviso>
      )}

      {datos.length === 0 ? (
        <MensajeAviso tipo="info">Todavía no hay contratos registrados.</MensajeAviso>
      ) : (
        <div className="rejilla-lotes">
          {datos.map((contrato) => (
            <TarjetaContrato key={contrato.id_contrato} contrato={contrato} />
          ))}
        </div>
      )}
      <Boton variante="secundario" icono="refrescar" alHacerClic={recargar} cargando={cargando}>
        ACTUALIZAR
      </Boton>
    </section>
  );
}
