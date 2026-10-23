// Boton unico de la aplicacion. Garantiza el verde corporativo para la accion principal y un
// objetivo tactil de al menos 44 px. Mientras carga queda deshabilitado para evitar el doble envio.

import Icono from "./Icono.jsx";
import IndicadorCarga from "./IndicadorCarga.jsx";

export default function Boton({
  children,
  variante = "primario",
  tipo = "button",
  cargando = false,
  deshabilitado = false,
  icono,
  alHacerClic,
  ...resto
}) {
  return (
    <button
      type={tipo}
      className={`boton boton--${variante}`}
      disabled={deshabilitado || cargando}
      aria-busy={cargando || undefined}
      onClick={alHacerClic}
      {...resto}
    >
      {cargando ? <IndicadorCarga etiqueta="Procesando" pequeno /> : icono && <Icono nombre={icono} tamano={20} />}
      <span>{children}</span>
    </button>
  );
}
