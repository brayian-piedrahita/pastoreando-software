// Franja roja fija que aparece cuando el navegador pierde la red (RNF01). Es transversal, por eso
// vive en App y no en cada pantalla.

import { useConexion } from "../hooks/useConexion.js";
import Icono from "./Icono.jsx";

export default function BannerConexion() {
  const enLinea = useConexion();
  if (enLinea) return null;

  return (
    <div className="banner-conexion" role="alert">
      <Icono nombre="sinNube" tamano={20} />
      <span>Sin conexión a internet. Se muestran los datos guardados en este dispositivo.</span>
    </div>
  );
}
