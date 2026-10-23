// Campo de contrasena con el ojo que alterna entre visible y oculta. El estado es solo visual,
// por eso vive aqui y no sale del componente.

import { useState } from "react";
import CampoFormulario from "./CampoFormulario.jsx";
import Icono from "./Icono.jsx";

export default function CampoClave({ etiqueta = "Contraseña", nombre = "contrasena", ...resto }) {
  const [visible, setVisible] = useState(false);

  const ojo = (
    <button
      type="button"
      className="campo__ojo"
      onClick={() => setVisible((v) => !v)}
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      aria-pressed={visible}
    >
      <Icono nombre={visible ? "ojoCerrado" : "ojo"} />
    </button>
  );

  return (
    <CampoFormulario
      etiqueta={etiqueta}
      nombre={nombre}
      tipo={visible ? "text" : "password"}
      icono="candado"
      accion={ojo}
      {...resto}
    />
  );
}
