// Ganado del contrato: lista de hatos, registro de uno nuevo (solo el arrendatario) y las
// recomendaciones de cada hato. Al registrar muestra la alerta de carga RF04 que devuelve la API.

import { useState } from "react";
import { useConsulta } from "../hooks/useConsulta.js";
import { useSesion } from "../hooks/useSesion.js";
import { ErrorApi } from "../servicios/clienteApi.js";
import { crearGanado, eliminarGanado, listarGanado } from "../servicios/servicioContratos.js";
import { mensajeDeError } from "../utilidades/errores.js";
import { puedeRegistrarGanado } from "../utilidades/permisos.js";
import AvisoNivel from "./AvisoNivel.jsx";
import Boton from "./Boton.jsx";
import FormularioGanado from "./FormularioGanado.jsx";
import IndicadorCarga from "./IndicadorCarga.jsx";
import MensajeAviso from "./MensajeAviso.jsx";
import PanelRecomendaciones from "./PanelRecomendaciones.jsx";

export default function SeccionGanado({ idContrato, contratoActivo, alCambiar }) {
  const { usuario } = useSesion();
  const { datos, cargando, error, recargar } = useConsulta(() => listarGanado(idContrato), {
    dependencias: [idContrato],
  });
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [erroresServidor, setErroresServidor] = useState({});
  const [alerta, setAlerta] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [abierto, setAbierto] = useState(null);

  // Al cambiar el ganado cambian el total de cabezas, el valor y el texto del contrato.
  const actualizar = () => {
    recargar();
    alCambiar();
  };

  const alGuardar = async (valores) => {
    setGuardando(true);
    setErrorGeneral("");
    setErroresServidor({});
    try {
      const guardado = await crearGanado(idContrato, valores);
      setAlerta(guardado.estado_carga);
      actualizar();
      return true;
    } catch (fallo) {
      if (fallo instanceof ErrorApi && fallo.campo) setErroresServidor({ [fallo.campo]: fallo.detalle });
      else setErrorGeneral(mensajeDeError(fallo));
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (idGanado) => {
    setErrorGeneral("");
    try {
      await eliminarGanado(idGanado);
      setPorEliminar(null);
      setAlerta(null);
      actualizar();
    } catch (fallo) {
      setErrorGeneral(mensajeDeError(fallo));
    }
  };

  if (cargando && !datos) return <IndicadorCarga etiqueta="Cargando el ganado" />;
  if (error) return <MensajeAviso tipo="error">{error.detalle ?? error.message}</MensajeAviso>;

  const propio = puedeRegistrarGanado(usuario.rol);

  return (
    <section className="seccion" aria-labelledby="titulo-ganado">
      <h2 id="titulo-ganado" className="pagina__subtitulo">Ganado del contrato</h2>
      {datos.length === 0 ? (
        <MensajeAviso tipo="info">Este contrato todavía no tiene ganado registrado.</MensajeAviso>
      ) : (
        <ul className="lista-hatos">
          {datos.map((hato) => (
            <li key={hato.id_ganado} className="hato">
              <div className="hato__resumen">
                <strong>{hato.raza}</strong>
                <span>{hato.cantidad_cabezas} cabezas</span>
                <span>{hato.proposito === "Doble Proposito" ? "Doble Propósito" : hato.proposito}</span>
              </div>
              <div className="hato__acciones">
                <Boton variante="secundario" icono="lista"
                  alHacerClic={() => setAbierto(abierto === hato.id_ganado ? null : hato.id_ganado)}
                  aria-expanded={abierto === hato.id_ganado}
                  aria-label={`Recomendaciones del hato ${hato.raza}`}>
                  RECOMENDACIONES
                </Boton>
                {propio && contratoActivo && porEliminar !== hato.id_ganado && (
                  <Boton variante="secundario" alHacerClic={() => setPorEliminar(hato.id_ganado)}
                    aria-label={`Eliminar el hato ${hato.raza}`}>
                    ELIMINAR
                  </Boton>
                )}
                {porEliminar === hato.id_ganado && (
                  <>
                    <Boton alHacerClic={() => borrar(hato.id_ganado)}>SÍ, ELIMINAR</Boton>
                    <Boton variante="secundario" alHacerClic={() => setPorEliminar(null)}>CANCELAR</Boton>
                  </>
                )}
              </div>
              {abierto === hato.id_ganado && <PanelRecomendaciones idGanado={hato.id_ganado} />}
            </li>
          ))}
        </ul>
      )}

      {alerta && <AvisoNivel nivel={alerta.nivel} mensaje={alerta.mensaje} />}
      {alerta && alerta.nivel === "NORMAL" && (
        <MensajeAviso tipo="exito">Hato registrado. El lote está dentro de su capacidad de carga.</MensajeAviso>
      )}

      {propio && contratoActivo && (
        <>
          <h3>Registrar un hato</h3>
          <FormularioGanado cargando={guardando} erroresServidor={erroresServidor} alGuardar={alGuardar} />
        </>
      )}
      {propio && !contratoActivo && (
        <MensajeAviso tipo="info">Solo se registra ganado en contratos activos.</MensajeAviso>
      )}
      <MensajeAviso tipo="error">{errorGeneral}</MensajeAviso>
    </section>
  );
}
