// Encabezado de las pantallas privadas: marca, usuario con su rol, cerrar sesion y el boton que
// abre el menu en pantallas pequenas (el menu fijo del prototipo no cabe en un celular).

import Boton from "./Boton.jsx";
import Icono from "./Icono.jsx";
import MarcaPastoreando from "./MarcaPastoreando.jsx";

export default function EncabezadoApp({ usuario, menuAbierto, alAlternarMenu, alCerrarSesion }) {
  return (
    <header className="encabezado">
      <button
        type="button"
        className="encabezado__menu"
        onClick={alAlternarMenu}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuAbierto}
        aria-controls="menu-lateral"
      >
        <Icono nombre={menuAbierto ? "cerrar" : "menu"} />
      </button>
      <MarcaPastoreando ancho={56} mostrarNombre={false} />
      <span className="encabezado__titulo">PASTOREANDO</span>
      <div className="encabezado__usuario">
        <span>
          {usuario.nombre} <small>{usuario.rol}</small>
        </span>
        <Boton variante="secundario" icono="salir" alHacerClic={alCerrarSesion}>
          Cerrar sesión
        </Boton>
      </div>
    </header>
  );
}
