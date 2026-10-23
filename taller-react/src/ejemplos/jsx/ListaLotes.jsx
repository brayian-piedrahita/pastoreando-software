// Lista de lotes con filtro: muestra listas con map y key, renderizado
// condicional y un campo controlado por estado.
import { useState } from "react";
import { TarjetaLote } from "./TarjetaLote.jsx";

export function ListaLotes({ lotes }) {
  const [filtro, setFiltro] = useState("TODOS");

  // Valor derivado del estado: no se guarda aparte, se calcula en cada render
  const visibles =
    filtro === "TODOS" ? lotes : lotes.filter((lote) => lote.estado === filtro);

  return (
    <section className="lista-lotes" aria-labelledby="titulo-lista-lotes">
      <h3 id="titulo-lista-lotes">Lotes disponibles</h3>

      <label htmlFor="filtro-estado">Filtrar por estado</label>
      <select
        id="filtro-estado"
        value={filtro}
        onChange={(evento) => setFiltro(evento.target.value)}
      >
        <option value="TODOS">Todos</option>
        <option value="NORMAL">Normal</option>
        <option value="ALERTA">Alerta</option>
        <option value="SOBRECARGA">Sobrecarga</option>
      </select>

      {visibles.length === 0 ? (
        <p>No hay lotes con ese estado.</p>
      ) : (
        <ul>
          {visibles.map((lote) => (
            // key identifica cada elemento para que React actualice solo lo que cambio
            <li key={lote.id}>
              <TarjetaLote
                nombre={lote.nombre}
                hectareas={lote.hectareas}
                estado={lote.estado}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
