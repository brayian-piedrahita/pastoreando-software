// Banner de alerta o sobrecarga con el mensaje que entrega la API. Con nivel NORMAL no se dibuja.

import Icono from "./Icono.jsx";

export default function AvisoNivel({ nivel, mensaje }) {
  if (nivel !== "ALERTA" && nivel !== "SOBRECARGA") return null;
  const critico = nivel === "SOBRECARGA";

  return (
    <div className={`aviso-nivel aviso-nivel--${critico ? "rojo" : "naranja"}`} role={critico ? "alert" : "status"}>
      <Icono nombre="alerta" tamano={20} />
      <span>{mensaje}</span>
    </div>
  );
}
