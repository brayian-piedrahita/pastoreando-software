// Limite de errores: captura los fallos de renderizado de sus hijos y muestra un aviso con un
// boton para reintentar, en vez de dejar la pantalla en blanco. React solo permite hacerlo con
// una clase (getDerivedStateFromError y componentDidCatch), por eso es el unico componente de clase.

import { Component } from "react";
import Boton from "./Boton.jsx";

export default class LimiteError extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error de renderizado:", error, info?.componentStack);
  }

  reintentar = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="pantalla-centrada">
        <section className="tarjeta-aviso" role="alert">
          <h1>Algo salió mal</h1>
          <p>La pantalla tuvo un problema inesperado. Sus datos guardados no se perdieron.</p>
          <Boton alHacerClic={this.reintentar}>REINTENTAR</Boton>
        </section>
      </main>
    );
  }
}
