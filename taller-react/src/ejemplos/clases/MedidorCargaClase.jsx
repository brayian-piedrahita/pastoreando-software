// Medidor de carga de un lote escrito como COMPONENTE DE CLASE.
// Muestra el constructor, el estado (this.state / setState), los metodos del
// ciclo de vida y el metodo render().
import { Component } from "react";
import { calcularEstadoCarga } from "../../utilidades/carga.js";

const TITULO_BASE = "Pastoreando";

export class MedidorCargaClase extends Component {
  constructor(props) {
    super(props); // obligatorio antes de usar this
    // Estado inicial del componente
    this.state = { cabezas: props.cabezasIniciales };
    // Los metodos que usan this se enlazan a la instancia
    this.agregarCabeza = this.agregarCabeza.bind(this);
    this.quitarCabeza = this.quitarCabeza.bind(this);
  }

  // Montaje: se ejecuta despues del primer pintado
  componentDidMount() {
    this.actualizarTitulo();
  }

  // Actualizacion: se ejecuta despues de cada cambio; se compara para no repetir trabajo
  componentDidUpdate(propiedadesPrevias, estadoPrevio) {
    if (estadoPrevio.cabezas !== this.state.cabezas) {
      this.actualizarTitulo();
    }
  }

  // Desmontaje: se deshace lo que el componente cambio fuera de si mismo
  componentWillUnmount() {
    document.title = TITULO_BASE;
  }

  actualizarTitulo() {
    const { porcentaje } = calcularEstadoCarga(
      this.state.cabezas,
      this.props.capacidad,
    );
    document.title = `${TITULO_BASE} - carga ${porcentaje}%`;
  }

  agregarCabeza() {
    // Forma funcional de setState: usa el valor mas reciente del estado
    this.setState((anterior) => ({ cabezas: anterior.cabezas + 1 }));
  }

  quitarCabeza() {
    this.setState((anterior) => ({ cabezas: Math.max(0, anterior.cabezas - 1) }));
  }

  render() {
    const { nombreLote, capacidad } = this.props;
    const { cabezas } = this.state;
    const { porcentaje, estado } = calcularEstadoCarga(cabezas, capacidad);

    return (
      <section
        className={`medidor medidor-${estado.toLowerCase()}`}
        aria-label={`Carga de ${nombreLote}`}
      >
        <h3>{nombreLote}</h3>
        <p className="medidor-detalle">
          {cabezas} de {capacidad} cabezas ({porcentaje} %)
        </p>
        <p role="status">Estado: {estado}</p>
        <button type="button" onClick={this.agregarCabeza}>
          Agregar cabeza
        </button>
        <button type="button" onClick={this.quitarCabeza}>
          Quitar cabeza
        </button>
      </section>
    );
  }
}
