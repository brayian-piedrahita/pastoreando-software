// El mismo medidor de MedidorCargaClase.jsx, escrito como COMPONENTE DE FUNCION
// con Hooks. useState reemplaza a this.state y useEffect reune el montaje, la
// actualizacion y el desmontaje en un solo lugar.
import { useEffect, useState } from "react";
import { calcularEstadoCarga } from "../../utilidades/carga.js";

const TITULO_BASE = "Pastoreando";

export function MedidorCargaFuncion({ nombreLote, capacidad, cabezasIniciales }) {
  const [cabezas, setCabezas] = useState(cabezasIniciales);
  const { porcentaje, estado } = calcularEstadoCarga(cabezas, capacidad);

  // Se ejecuta despues del primer pintado y cada vez que cambia el porcentaje
  useEffect(() => {
    document.title = `${TITULO_BASE} - carga ${porcentaje}%`;
    // La funcion que se devuelve es la limpieza: corre antes de volver a
    // ejecutar el efecto y cuando el componente se desmonta
    return () => {
      document.title = TITULO_BASE;
    };
  }, [porcentaje]);

  const agregarCabeza = () => setCabezas((anterior) => anterior + 1);
  const quitarCabeza = () => setCabezas((anterior) => Math.max(0, anterior - 1));

  return (
    <section
      className={`medidor medidor-${estado.toLowerCase()}`}
      aria-label={`Carga de ${nombreLote}`}
    >
      <h3>{nombreLote}</h3>
      <p className="medidor-detalle">
        {cabezas} de {capacidad} cabezas ({porcentaje} %)
      </p>
      <p role="status">Estado: {estado}</p>
      <button type="button" onClick={agregarCabeza}>
        Agregar cabeza
      </button>
      <button type="button" onClick={quitarCabeza}>
        Quitar cabeza
      </button>
    </section>
  );
}
