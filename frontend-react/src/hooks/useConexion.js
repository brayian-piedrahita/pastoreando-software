// Indica si el navegador tiene red. Escucha los eventos online y offline y limpia los
// escuchadores al desmontar para no dejar fugas.

import { useEffect, useState } from "react";

export function useConexion() {
  const [enLinea, setEnLinea] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const alConectar = () => setEnLinea(true);
    const alDesconectar = () => setEnLinea(false);
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
    };
  }, []);

  return enLinea;
}
