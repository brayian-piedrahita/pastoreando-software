// Punto unico de acceso a la sesion. Falla con un mensaje claro si falta el proveedor.

import { useContext } from "react";
import { ContextoSesion } from "../contexto/ProveedorSesion.jsx";

export function useSesion() {
  const contexto = useContext(ContextoSesion);
  if (contexto === null) {
    throw new Error("useSesion debe usarse dentro de ProveedorSesion");
  }
  return contexto;
}
