// Pagos del contrato: historial, totales por estado, registro de un pago nuevo (arrendatario) y
// confirmacion o rechazo de los pendientes (propietario del lote o contador).

import { useState } from "react";
import { useConsulta } from "../hooks/useConsulta.js";
import { useSesion } from "../hooks/useSesion.js";
import { ErrorApi } from "../servicios/clienteApi.js";
import { listarPagos, registrarPago, resolverPago } from "../servicios/servicioPagos.js";
import { mensajeDeError } from "../utilidades/errores.js";
import { formatoFecha, formatoMoneda } from "../utilidades/formato.js";
import { puedeRegistrarPago, puedeResolverPagos } from "../utilidades/permisos.js";
import { TEXTO_METODO } from "../utilidades/validaciones.js";
import Boton from "./Boton.jsx";
import FormularioPago from "./FormularioPago.jsx";
import IndicadorCarga from "./IndicadorCarga.jsx";
import InsigniaEstado from "./InsigniaEstado.jsx";
import MensajeAviso from "./MensajeAviso.jsx";

const sumar = (pagos, estado) =>
  pagos.filter((p) => p.estado_pago === estado).reduce((total, p) => total + p.monto_total, 0);

export default function SeccionPagos({ idContrato, contratoActivo }) {
  const { usuario } = useSesion();
  const { datos, cargando, error, recargar } = useConsulta(() => listarPagos(idContrato), {
    dependencias: [idContrato],
  });
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [erroresServidor, setErroresServidor] = useState({});
  const [resolviendo, setResolviendo] = useState(null);

  const alGuardar = async (valores) => {
    setGuardando(true);
    setErrorGeneral("");
    setErroresServidor({});
    try {
      await registrarPago(idContrato, valores);
      recargar();
      return true;
    } catch (fallo) {
      if (fallo instanceof ErrorApi && fallo.campo) setErroresServidor({ [fallo.campo]: fallo.detalle });
      else setErrorGeneral(mensajeDeError(fallo));
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const resolver = async (idPago, estado) => {
    setResolviendo(idPago);
    setErrorGeneral("");
    try {
      await resolverPago(idPago, estado);
      recargar();
    } catch (fallo) {
      setErrorGeneral(mensajeDeError(fallo));
    } finally {
      setResolviendo(null);
    }
  };

  if (cargando && !datos) return <IndicadorCarga etiqueta="Cargando los pagos" />;
  if (error) return <MensajeAviso tipo="error">{error.detalle ?? error.message}</MensajeAviso>;

  const puedeResolver = puedeResolverPagos(usuario.rol);
  const puedeRegistrar = puedeRegistrarPago(usuario.rol);

  return (
    <section className="seccion" aria-labelledby="titulo-pagos">
      <h2 id="titulo-pagos" className="pagina__subtitulo">Pagos</h2>
      <p className="totales-pagos">
        Confirmado: <strong>{formatoMoneda(sumar(datos, "Confirmado"))}</strong> · Pendiente:{" "}
        <strong>{formatoMoneda(sumar(datos, "Pendiente"))}</strong>
      </p>

      {datos.length === 0 ? (
        <MensajeAviso tipo="info">Este contrato todavía no tiene pagos registrados.</MensajeAviso>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <caption className="solo-lectores">Pagos del contrato</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Monto</th>
                <th scope="col">Método</th>
                <th scope="col">Estado</th>
                {puedeResolver && <th scope="col">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {datos.map((pago) => (
                <tr key={pago.id_pago}>
                  <td>{formatoFecha(pago.fecha_pago)}</td>
                  <td className="tabla__numero">{formatoMoneda(pago.monto_total)}</td>
                  <td>{TEXTO_METODO[pago.metodo_pago] ?? pago.metodo_pago}</td>
                  <td>
                    <InsigniaEstado estado={pago.estado_pago} />
                  </td>
                  {puedeResolver && (
                    <td>
                      {pago.estado_pago === "Pendiente" && (
                        <span className="tabla__acciones">
                          <Boton cargando={resolviendo === pago.id_pago}
                            alHacerClic={() => resolver(pago.id_pago, "Confirmado")}
                            aria-label={`Confirmar el pago ${pago.id_pago}`}>
                            CONFIRMAR
                          </Boton>
                          <Boton variante="secundario" deshabilitado={resolviendo === pago.id_pago}
                            alHacerClic={() => resolver(pago.id_pago, "Rechazado")}
                            aria-label={`Rechazar el pago ${pago.id_pago}`}>
                            RECHAZAR
                          </Boton>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {puedeRegistrar && contratoActivo && (
        <>
          <h3>Registrar un pago</h3>
          <FormularioPago cargando={guardando} erroresServidor={erroresServidor} alGuardar={alGuardar} />
        </>
      )}
      {puedeRegistrar && !contratoActivo && (
        <MensajeAviso tipo="info">Solo se registran pagos en contratos activos.</MensajeAviso>
      )}
      <MensajeAviso tipo="error">{errorGeneral}</MensajeAviso>
    </section>
  );
}
