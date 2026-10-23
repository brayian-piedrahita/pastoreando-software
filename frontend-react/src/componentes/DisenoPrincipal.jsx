// Marco de las pantallas privadas: encabezado, menu lateral y la zona donde se dibuja cada
// pagina (Outlet). Guarda el estado del menu porque lo comparten el boton y la lista.

import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useSesion } from "../hooks/useSesion.js";
import EncabezadoApp from "./EncabezadoApp.jsx";
import MenuLateral from "./MenuLateral.jsx";

export default function DisenoPrincipal() {
  const { usuario, cerrarSesion } = useSesion();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const salir = () => {
    cerrarSesion();
    navegar("/login", { replace: true });
  };

  return (
    <div className="diseno">
      <EncabezadoApp
        usuario={usuario}
        menuAbierto={menuAbierto}
        alAlternarMenu={() => setMenuAbierto((abierto) => !abierto)}
        alCerrarSesion={salir}
      />
      <MenuLateral abierto={menuAbierto} rol={usuario.rol} alNavegar={() => setMenuAbierto(false)} />
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
