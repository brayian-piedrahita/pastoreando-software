// Demostracion del limite de error: un boton provoca el fallo y otro lo reinicia.
import { useState } from "react";
import { ComponenteQueFalla } from "./ComponenteQueFalla.jsx";
import { LimiteError } from "./LimiteError.jsx";

export function DemoLimiteError() {
  const [fallar, setFallar] = useState(false);
  // Cambiar la key obliga a React a crear de nuevo el limite (se limpia el error)
  const [intento, setIntento] = useState(0);

  function reiniciar() {
    setFallar(false);
    setIntento((anterior) => anterior + 1);
  }

  return (
    <section className="demo-error" aria-labelledby="titulo-demo-error">
      <h3 id="titulo-demo-error">Limite de error</h3>
      <LimiteError key={intento} mensaje="Esta sección falló y fue aislada.">
        <ComponenteQueFalla fallar={fallar} />
      </LimiteError>
      <button type="button" onClick={() => setFallar(true)}>
        Provocar fallo
      </button>
      <button type="button" onClick={reiniciar}>
        Reiniciar
      </button>
    </section>
  );
}
