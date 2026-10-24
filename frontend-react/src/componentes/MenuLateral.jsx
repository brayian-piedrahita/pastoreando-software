// Menu de las pantallas privadas. NavLink marca la ruta activa sin codigo adicional y la opcion
// de costos se oculta a los roles que la API rechazaria.

import { NavLink } from "react-router";
import { puedeCalcularCostos, puedeVerReportes } from "../utilidades/permisos.js";
import Icono from "./Icono.jsx";

export default function MenuLateral({ abierto, rol, alNavegar }) {
  const opciones = [
    { ruta: "/panel", texto: "Panel de control", icono: "panel", visible: true },
    { ruta: "/costos", texto: "Módulo contable (RF01)", icono: "calculadora", visible: puedeCalcularCostos(rol) },
    { ruta: "/monitoreo", texto: "Monitoreo ambiental (RF04)", icono: "alerta", visible: true },
    { ruta: "/contratos", texto: "Contratos y firma (RF05)", icono: "contrato", visible: true },
    { ruta: "/reportes", texto: "Reportes (RF06)", icono: "grafica", visible: puedeVerReportes(rol) },
  ];

  return (
    <nav id="menu-lateral" className={`menu-lateral${abierto ? " menu-lateral--abierto" : ""}`} aria-label="Principal">
      <ul>
        {opciones
          .filter((opcion) => opcion.visible)
          .map((opcion) => (
            <li key={opcion.ruta}>
              <NavLink to={opcion.ruta} onClick={alNavegar}>
                <Icono nombre={opcion.icono} tamano={22} />
                <span>{opcion.texto}</span>
              </NavLink>
            </li>
          ))}
      </ul>
    </nav>
  );
}
