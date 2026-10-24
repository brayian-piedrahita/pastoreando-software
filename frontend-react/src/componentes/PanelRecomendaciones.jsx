// Recomendaciones tecnicas de un hato. Todos los que ven el contrato las leen; solo el tecnico
// escribe, y solo borra las que escribio el mismo.

import { useState } from "react";
import { useConsulta } from "../hooks/useConsulta.js";
import { useFormulario } from "../hooks/useFormulario.js";
import { useSesion } from "../hooks/useSesion.js";
import { ErrorApi } from "../servicios/clienteApi.js";
import {
  crearRecomendacion, eliminarRecomendacion, listarRecomendaciones,
} from "../servicios/servicioRecomendaciones.js";
import { mensajeDeError } from "../utilidades/errores.js";
import { formatoFecha } from "../utilidades/formato.js";
import { puedeRecomendar } from "../utilidades/permisos.js";
import { validarRecomendacion } from "../utilidades/validaciones.js";
import Boton from "./Boton.jsx";
import CampoAreaTexto from "./CampoAreaTexto.jsx";
import IndicadorCarga from "./IndicadorCarga.jsx";
import MensajeAviso from "./MensajeAviso.jsx";

export default function PanelRecomendaciones({ idGanado }) {
  const { usuario } = useSesion();
  const { datos, cargando, error, recargar } = useConsulta(() => listarRecomendaciones(idGanado), {
    dependencias: [idGanado],
  });
  const { valores, errores, alCambiar, establecerErrores } = useFormulario({ descripcion: "" });
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const encontrados = validarRecomendacion(valores);
    establecerErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setGuardando(true);
    setErrorGeneral("");
    try {
      await crearRecomendacion(idGanado, valores.descripcion);
      alCambiar({ target: { name: "descripcion", value: "" } });
      recargar();
    } catch (fallo) {
      if (fallo instanceof ErrorApi && fallo.campo === "descripcion") establecerErrores({ descripcion: fallo.detalle });
      else setErrorGeneral(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (idRecomendacion) => {
    setErrorGeneral("");
    try {
      await eliminarRecomendacion(idRecomendacion);
      recargar();
    } catch (fallo) {
      setErrorGeneral(mensajeDeError(fallo));
    }
  };

  if (cargando && !datos) return <IndicadorCarga etiqueta="Cargando las recomendaciones" />;
  if (error) return <MensajeAviso tipo="error">{error.detalle ?? error.message}</MensajeAviso>;

  return (
    <div className="recomendaciones">
      {datos.length === 0 ? (
        <p className="recomendaciones__vacio">Este hato todavía no tiene recomendaciones.</p>
      ) : (
        <ul className="recomendaciones__lista">
          {datos.map((r) => (
            <li key={r.id_recomendacion}>
              <p>{r.descripcion}</p>
              <small>
                {r.nombre_tecnico} · {formatoFecha(r.fecha_recomendacion)}
              </small>
              {usuario.id_usuario === r.id_zootecnista && (
                <Boton variante="secundario" alHacerClic={() => borrar(r.id_recomendacion)}
                  aria-label={`Eliminar la recomendación ${r.id_recomendacion}`}>
                  ELIMINAR
                </Boton>
              )}
            </li>
          ))}
        </ul>
      )}
      {puedeRecomendar(usuario.rol) && (
        <form className="formulario formulario--compacto" onSubmit={alEnviar} noValidate
          aria-label="Nueva recomendación">
          <CampoAreaTexto etiqueta="Nueva recomendación técnica" nombre={`descripcion-${idGanado}`}
            valor={valores.descripcion} error={errores.descripcion} icono="lista"
            alCambiar={(evento) => alCambiar({ target: { name: "descripcion", value: evento.target.value } })} />
          <Boton tipo="submit" cargando={guardando} icono="lista">
            AGREGAR RECOMENDACIÓN
          </Boton>
        </form>
      )}
      <MensajeAviso tipo="error">{errorGeneral}</MensajeAviso>
    </div>
  );
}
