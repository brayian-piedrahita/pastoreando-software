// Boton que despliega las acciones sugeridas para el nivel de carga. La informacion secundaria
// queda oculta por defecto para mantener la pantalla limpia en el celular.

import { useId, useState } from "react";
import Boton from "./Boton.jsx";

export default function PanelSugerencias({ sugerencias = [] }) {
  const [abierto, setAbierto] = useState(false);
  const idLista = useId();

  if (sugerencias.length === 0) return null;

  return (
    <div className="sugerencias">
      <Boton
        variante="secundario"
        alHacerClic={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls={idLista}
      >
        {abierto ? "OCULTAR RECOMENDACIONES" : "VER RECOMENDACIONES"}
      </Boton>
      {abierto && (
        <ul id={idLista} className="sugerencias__lista">
          {sugerencias.map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
