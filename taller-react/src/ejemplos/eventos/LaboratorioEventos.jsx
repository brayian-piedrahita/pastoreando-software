// Laboratorio de eventos: cada elemento dispara un evento de React y el
// componente lo anota en una lista para poder verlo.
import { useRef, useState } from "react";

// Cantidad maxima de eventos que se conservan en la lista
const MAXIMO_REGISTROS = 8;

export function LaboratorioEventos() {
  const [texto, setTexto] = useState("");
  const [registros, setRegistros] = useState([]);
  // useRef conserva un valor entre renders sin provocar uno nuevo
  const contador = useRef(0);

  function registrar(tipo, detalle) {
    contador.current += 1;
    const nuevo = { id: contador.current, tipo, detalle };
    // El evento mas reciente va primero; se descartan los mas antiguos
    setRegistros((anteriores) => [nuevo, ...anteriores].slice(0, MAXIMO_REGISTROS));
  }

  // onChange: se dispara en cada cambio del campo, no solo al salir de el
  function alCambiarTexto(evento) {
    setTexto(evento.target.value);
    registrar("onChange", `valor: "${evento.target.value}"`);
  }

  // onSubmit: se evita el envio nativo del navegador, que recargaria la pagina
  function alEnviar(evento) {
    evento.preventDefault();
    registrar("onSubmit", "formulario enviado sin recargar la página");
  }

  return (
    <section className="laboratorio" aria-labelledby="titulo-laboratorio">
      <h3 id="titulo-laboratorio">Laboratorio de eventos</h3>

      <form onSubmit={alEnviar}>
        <label htmlFor="campo-evento">Escriba algo para disparar eventos</label>
        <input
          id="campo-evento"
          type="text"
          value={texto}
          onChange={alCambiarTexto}
          onFocus={() => registrar("onFocus", "el campo recibió el foco")}
          onBlur={() => registrar("onBlur", "el campo perdió el foco")}
          onKeyDown={(evento) => registrar("onKeyDown", `tecla: ${evento.key}`)}
        />
        <button
          type="button"
          onClick={() => registrar("onClick", "botón Registrar clic")}
        >
          Registrar clic
        </button>
        <button type="submit">Enviar formulario</button>
      </form>

      <div
        className="zona-eventos"
        onDoubleClick={() => registrar("onDoubleClick", "doble clic en la zona")}
        onMouseEnter={() => registrar("onMouseEnter", "el cursor entró a la zona")}
        onMouseLeave={() => registrar("onMouseLeave", "el cursor salió de la zona")}
        onTouchStart={() => registrar("onTouchStart", "toque en la zona (celular)")}
      >
        Pase el cursor, haga doble clic o toque esta zona
      </div>

      <ol aria-label="Registro de eventos" className="registro-eventos">
        {registros.map((registro) => (
          <li key={registro.id}>
            <strong>{registro.tipo}</strong> {registro.detalle}
          </li>
        ))}
      </ol>
    </section>
  );
}
