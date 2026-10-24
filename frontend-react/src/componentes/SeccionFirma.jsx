// Documento del contrato y firma digital (RF05). Muestra el texto generado con su huella SHA-256 y
// las firmas registradas. Si el ganado cambia, el texto cambia y las firmas anteriores quedan
// desactualizadas hasta que las partes vuelvan a firmar.

import { useState } from "react";
import { useConsulta } from "../hooks/useConsulta.js";
import { useSesion } from "../hooks/useSesion.js";
import { obtenerDocumento } from "../servicios/servicioContratos.js";
import { consultarFirmas, firmarContrato } from "../servicios/servicioFirmas.js";
import { mensajeDeError } from "../utilidades/errores.js";
import { formatoFechaHora } from "../utilidades/formato.js";
import { puedeFirmar } from "../utilidades/permisos.js";
import Boton from "./Boton.jsx";
import IndicadorCarga from "./IndicadorCarga.jsx";
import InsigniaEstado from "./InsigniaEstado.jsx";
import MensajeAviso from "./MensajeAviso.jsx";

export default function SeccionFirma({ idContrato, contratoActivo, version }) {
  const { usuario } = useSesion();
  const dependencias = [idContrato, version];
  const documento = useConsulta(() => obtenerDocumento(idContrato), { dependencias });
  const firmas = useConsulta(() => consultarFirmas(idContrato), { dependencias });
  const [firmando, setFirmando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const firmar = async () => {
    setFirmando(true);
    setErrorGeneral("");
    try {
      await firmarContrato(idContrato);
      firmas.recargar();
    } catch (fallo) {
      setErrorGeneral(mensajeDeError(fallo));
    } finally {
      setFirmando(false);
    }
  };

  if ((documento.cargando && !documento.datos && !documento.error) || (firmas.cargando && !firmas.datos && !firmas.error)) {
    return <IndicadorCarga etiqueta="Cargando el documento" />;
  }

  const lista = firmas.datos?.firmas ?? [];
  const yaFirmo = lista.some((f) => f.id_usuario === usuario.id_usuario && f.vigente);

  return (
    <section className="seccion" aria-labelledby="titulo-firma">
      <h2 id="titulo-firma" className="pagina__subtitulo">Documento y firma digital</h2>

      {documento.error ? (
        <MensajeAviso tipo="info">{documento.error.detalle ?? documento.error.message}</MensajeAviso>
      ) : (
        <>
          <pre className="documento" aria-label="Texto del contrato">{documento.datos.texto}</pre>
          <p className="huella">
            Huella SHA-256: <code>{documento.datos.huella_sha256}</code>
          </p>
        </>
      )}

      <MensajeAviso tipo="error">{firmas.error && (firmas.error.detalle ?? firmas.error.message)}</MensajeAviso>
      {lista.length === 0 ? (
        <p className="recomendaciones__vacio">Todavía nadie ha firmado este contrato.</p>
      ) : (
        <ul className="lista-firmas">
          {lista.map((f) => (
            <li key={f.id_firma}>
              <strong>{f.nombre_firmante}</strong> ({f.rol_firmante}) · {formatoFechaHora(f.fecha_firma)}{" "}
              <InsigniaEstado estado={f.vigente ? "Vigente" : "Desactualizada"} />
            </li>
          ))}
        </ul>
      )}

      {firmas.datos?.firmado_por_ambas_partes && (
        <MensajeAviso tipo="exito">El contrato está firmado por ambas partes.</MensajeAviso>
      )}
      {puedeFirmar(usuario.rol) && contratoActivo && !documento.error && !yaFirmo && (
        <Boton icono="firma" cargando={firmando} alHacerClic={firmar}>
          FIRMAR CONTRATO
        </Boton>
      )}
      {puedeFirmar(usuario.rol) && yaFirmo && <MensajeAviso tipo="info">Usted ya firmó la versión vigente.</MensajeAviso>}
      <MensajeAviso tipo="error">{errorGeneral}</MensajeAviso>
    </section>
  );
}
