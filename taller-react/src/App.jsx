// Componente raiz del taller: reune los ejemplos de JSX, clases y eventos.
import { useState } from "react";
import { DemoLimiteError } from "./ejemplos/clases/DemoLimiteError.jsx";
import { MedidorCargaClase } from "./ejemplos/clases/MedidorCargaClase.jsx";
import { MedidorCargaFuncion } from "./ejemplos/clases/MedidorCargaFuncion.jsx";
import { FormularioGanado } from "./ejemplos/eventos/FormularioGanado.jsx";
import { IndicadorConexion } from "./ejemplos/eventos/IndicadorConexion.jsx";
import { LaboratorioEventos } from "./ejemplos/eventos/LaboratorioEventos.jsx";
import { ListaLotes } from "./ejemplos/jsx/ListaLotes.jsx";
import { TarjetaLote } from "./ejemplos/jsx/TarjetaLote.jsx";
import { TarjetaLoteSinJsx } from "./ejemplos/jsx/TarjetaLoteSinJsx.js";
import { LOTES_EJEMPLO } from "./utilidades/lotesEjemplo.js";

export function App() {
  // "clase" o "funcion": cual de los dos medidores se muestra
  const [version, setVersion] = useState("clase");
  const [hatos, setHatos] = useState([]);

  function registrarHato(hato) {
    setHatos((anteriores) => [...anteriores, { id: anteriores.length + 1, ...hato }]);
  }

  return (
    <>
      <IndicadorConexion />
      <header className="cabecera">
        <h1>Pastoreando</h1>
        <p>Taller de componentes frontend con React</p>
      </header>

      <main className="contenido">
        <section aria-labelledby="titulo-jsx">
          <h2 id="titulo-jsx">1. React y JSX</h2>
          <p>La misma tarjeta, escrita con JSX y sin JSX:</p>
          <div className="par">
            <TarjetaLote nombre="Lote La Esperanza" hectareas={12} estado="NORMAL" />
            <TarjetaLoteSinJsx nombre="Lote La Esperanza" hectareas={12} estado="NORMAL" />
          </div>
          <ListaLotes lotes={LOTES_EJEMPLO} />
        </section>

        <section aria-labelledby="titulo-clases">
          <h2 id="titulo-clases">2. Clases en React</h2>
          <div className="selector" role="group" aria-label="Versión del componente">
            <button
              type="button"
              aria-pressed={version === "clase"}
              onClick={() => setVersion("clase")}
            >
              Componente de clase
            </button>
            <button
              type="button"
              aria-pressed={version === "funcion"}
              onClick={() => setVersion("funcion")}
            >
              Componente de función
            </button>
          </div>
          {version === "clase" ? (
            <MedidorCargaClase nombreLote="Lote El Rosal" capacidad={10} cabezasIniciales={7} />
          ) : (
            <MedidorCargaFuncion nombreLote="Lote El Rosal" capacidad={10} cabezasIniciales={7} />
          )}
          <DemoLimiteError />
        </section>

        <section aria-labelledby="titulo-eventos">
          <h2 id="titulo-eventos">3. Eventos de React</h2>
          <LaboratorioEventos />
          <h3>Registro de hatos</h3>
          <FormularioGanado alRegistrar={registrarHato} />
          {hatos.length > 0 && (
            <ul aria-label="Hatos registrados" className="hatos">
              {hatos.map((hato) => (
                <li key={hato.id}>
                  {hato.cantidadCabezas} cabezas de {hato.raza} ({hato.proposito})
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
