// Ruta comodin: informa que la direccion no existe y lleva al panel.

import { Link } from "react-router";

export default function PaginaNoEncontrada() {
  return (
    <main className="pantalla-centrada">
      <section className="tarjeta-aviso">
        <h1>Página no encontrada</h1>
        <p>La dirección que intenta abrir no existe en Pastoreando.</p>
        <Link className="boton boton--primario" to="/panel">
          <span>IR AL PANEL</span>
        </Link>
      </section>
    </main>
  );
}
