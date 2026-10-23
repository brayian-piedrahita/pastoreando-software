// Lista desplegable controlada. Las opciones llegan como arreglo de textos o de { valor, texto }.

import Icono from "./Icono.jsx";

export default function CampoSeleccion({
  etiqueta,
  nombre,
  valor,
  alCambiar,
  opciones,
  error,
  icono,
  textoVacio,
  ...resto
}) {
  const id = `campo-${nombre}`;
  const idError = `${id}-error`;

  return (
    <div className={`campo${error ? " campo--error" : ""}`}>
      {icono && <Icono nombre={icono} className="campo__icono" />}
      <div className="campo__cuerpo">
        <label htmlFor={id}>{etiqueta}</label>
        <select
          id={id}
          name={nombre}
          value={valor}
          onChange={alCambiar}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? idError : undefined}
          {...resto}
        >
          {textoVacio && <option value="">{textoVacio}</option>}
          {opciones.map((opcion) => {
            const { valor: v, texto } = typeof opcion === "string" ? { valor: opcion, texto: opcion } : opcion;
            return (
              <option key={v} value={v}>
                {texto}
              </option>
            );
          })}
        </select>
        {error && (
          <p id={idError} className="campo__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
