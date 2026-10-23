// Limite de error: captura los fallos de render de sus hijos y muestra un
// aviso en lugar de dejar la pantalla en blanco.
// Es el caso en que React todavia exige una clase: getDerivedStateFromError y
// componentDidCatch no tienen equivalente en componentes de funcion.
import { Component } from "react";

export class LimiteError extends Component {
  constructor(props) {
    super(props);
    this.state = { huboError: false };
  }

  // Se llama durante el render cuando un hijo lanza un error: actualiza el estado
  static getDerivedStateFromError() {
    return { huboError: true };
  }

  // Se llama despues del error: sirve para registrarlo (servicio de monitoreo, consola)
  componentDidCatch(error, informacion) {
    if (this.props.alRegistrar) {
      this.props.alRegistrar(error, informacion.componentStack);
    }
  }

  render() {
    if (this.state.huboError) {
      return (
        <div role="alert" className="aviso-error">
          {this.props.mensaje ?? "No se pudo mostrar esta sección."}
        </div>
      );
    }
    return this.props.children;
  }
}
