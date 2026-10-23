// Exige sesion para mostrar su contenido. Sin sesion lleva a /login recordando la pantalla pedida;
// con sesion pero sin el rol permitido lleva al panel. Refleja lo que la API ya exige (401 y 403):
// el backend sigue siendo la autoridad.

import { Navigate, useLocation } from "react-router";
import { useSesion } from "../hooks/useSesion.js";

export default function RutaProtegida({ roles, children }) {
  const { usuario } = useSesion();
  const ubicacion = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/panel" replace />;
  }
  return children;
}
