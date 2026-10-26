// Modulo contable (prototipo calculo_ug.html, RF01 y RF02). Guarda el resultado del calculo y la
// vista elegida (unidad ganadera o lote completo), que comparten sus hijos.

import { useEffect, useState } from "react";
import DesgloseCostos from "../componentes/DesgloseCostos.jsx";
import FormularioCosto from "../componentes/FormularioCosto.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import ResultadoCosto from "../componentes/ResultadoCosto.jsx";
import SelectorOpciones from "../componentes/SelectorOpciones.jsx";
import { ErrorApi, ErrorRed } from "../servicios/clienteApi.js";
import { calcularCosto, listarEstrategias } from "../servicios/servicioCostos.js";
import { PROPOSITOS } from "../utilidades/validaciones.js";

const VISTAS = [
  { valor: "unidad", texto: "Unidad Ganadera" },
  { valor: "lote", texto: "Lote Completo" },
];

// Texto que ve el usuario para cada proposito; el valor enviado a la API no lleva tilde.
const TEXTO_PROPOSITO = { "Doble Proposito": "Doble Propósito" };
const aOpcion = (proposito) => ({ valor: proposito, texto: TEXTO_PROPOSITO[proposito] ?? proposito });

export default function PaginaCalculoCosto() {
  const [propositos, setPropositos] = useState(PROPOSITOS.map(aOpcion));
  const [resultado, setResultado] = useState(null);
  const [vista, setVista] = useState("unidad");
  const [calculando, setCalculando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [erroresServidor, setErroresServidor] = useState({});

  // Los propositos salen de la API; si no responde se usa la lista local, que es la misma.
  useEffect(() => {
    let vigente = true;
    listarEstrategias()
      .then((estrategias) => {
        if (vigente) setPropositos(estrategias.map((e) => aOpcion(e.proposito)));
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);

  const alCalcular = async (valores) => {
    setCalculando(true);
    setErrorGeneral("");
    setErroresServidor({});
    try {
      setResultado(await calcularCosto(valores));
    } catch (error) {
      if (error instanceof ErrorApi && error.campo) {
        setErroresServidor({ [error.campo]: error.detalle });
      } else if (error instanceof ErrorApi) {
        setErrorGeneral(error.detalle);
      } else if (error instanceof ErrorRed) {
        setErrorGeneral("No hay conexión con el servidor. El cálculo necesita red; intente de nuevo cuando la recupere.");
      } else {
        throw error;
      }
    } finally {
      setCalculando(false);
    }
  };

  const porUnidad = vista === "unidad";

  return (
    <section className="pagina">
      <h1 className="pagina__titulo">Módulo contable integral</h1>
      <div className="dos-columnas">
        <div>
          <FormularioCosto propositos={propositos} cargando={calculando} erroresServidor={erroresServidor}
            alCalcular={alCalcular} alInvalido={() => setResultado(null)} />
          <MensajeAviso tipo="error">{errorGeneral}</MensajeAviso>
        </div>
        <div>
          <h2 className="pagina__subtitulo">Desglose de costos</h2>
          <SelectorOpciones leyenda="Ver costos por:" nombre="vista_costos" opciones={VISTAS} valor={vista}
            alCambiar={setVista} />
          <DesgloseCostos
            desglose={resultado?.desglose}
            vista={vista}
            total={porUnidad ? resultado?.costo_base_por_cabeza : resultado?.subtotal_lote}
          />
          <ResultadoCosto
            titulo={porUnidad ? "Costo unitario calculado" : "Costo total del lote"}
            valor={resultado ? (porUnidad ? resultado.costo_unitario_final : resultado.total_lote_final) : null}
            nota={resultado
              ? `Incluye margen proyectado del ${resultado.margen_porcentaje} %`
              : "Ingrese los valores y presione calcular"}
          />
        </div>
      </div>
    </section>
  );
}
