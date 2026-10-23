// Lista de los cuatro rubros del costo y su total. Dibuja el desglose que devuelve la API sin
// recalcularlo: solo elige la columna segun la vista (por unidad ganadera o del lote completo).

import { formatoMoneda, formatoPorcentaje } from "../utilidades/formato.js";
import FilaRubro from "./FilaRubro.jsx";

const DETALLE_RUBROS = {
  Alimentación: { icono: "hoja", descripcion: "Insumos y pasturas" },
  Mantenimiento: { icono: "llave", descripcion: "Obras y cercos" },
  Servicios: { icono: "gota", descripcion: "Agua y electricidad" },
  Impuestos: { icono: "recibo", descripcion: "Tributarios y legales" },
};

// Mientras no hay calculo se muestran los cuatro rubros sin valor, como en el prototipo.
const RUBROS_VACIOS = Object.keys(DETALLE_RUBROS).map((rubro) => ({ rubro }));

export default function DesgloseCostos({ desglose, vista = "unidad", total }) {
  const filas = desglose?.length ? desglose : RUBROS_VACIOS;
  const hayDatos = Boolean(desglose?.length);

  return (
    <div className="desglose">
      <ul className="desglose__lista">
        {filas.map((fila) => {
          const extra = DETALLE_RUBROS[fila.rubro] ?? { icono: "recibo", descripcion: "" };
          const valor = vista === "unidad" ? fila.valor_por_cabeza : fila.valor_lote;
          return (
            <FilaRubro
              key={fila.rubro}
              icono={extra.icono}
              nombre={fila.rubro}
              descripcion={extra.descripcion}
              valor={hayDatos ? formatoMoneda(valor) : null}
              detalle={hayDatos ? formatoPorcentaje(fila.porcentaje) : null}
            />
          );
        })}
      </ul>
      {hayDatos && (
        <p className="desglose__total">
          <span>{vista === "unidad" ? "Costo base por unidad ganadera" : "Costo base del lote"}</span>
          <strong>{formatoMoneda(total)}</strong>
        </p>
      )}
    </div>
  );
}
