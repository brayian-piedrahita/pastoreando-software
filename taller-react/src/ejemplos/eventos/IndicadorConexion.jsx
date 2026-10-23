// Franja de aviso cuando el dispositivo pierde la conexion (RNF01).
// "online" y "offline" son eventos del navegador (window), no de React:
// se escuchan con useEffect y se retiran al desmontar el componente.
import { useEffect, useState } from "react";

export function IndicadorConexion() {
  // Valor inicial calculado una sola vez al montar
  const [enLinea, setEnLinea] = useState(() => navigator.onLine);

  useEffect(() => {
    const alConectar = () => setEnLinea(true);
    const alDesconectar = () => setEnLinea(false);

    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);

    // Limpieza: sin ella se acumularian escuchas cada vez que se monte el componente
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
    };
  }, []);

  if (enLinea) {
    return null;
  }

  return (
    <div role="alert" className="franja-sin-conexion">
      Sin conexión. Algunas funciones no estarán disponibles hasta que vuelva la señal.
    </div>
  );
}
