// Area de texto controlada con etiqueta y mensaje de error, con el mismo aspecto que CampoFormulario.

import Icono from "./Icono.jsx";

export default function CampoAreaTexto({ etiqueta, nombre, valor, alCambiar, error, icono, ...resto }) {
  const id = `campo-${nombre}`;
  const idError = `${id}-error`;

  return (
    <div className={`campo${error ? " campo--error" : ""}`}>
      {icono && <Icono nombre={icono} className="campo__icono" />}
      <div className="campo__cuerpo">
        <label htmlFor={id}>{etiqueta}</label>
        <textarea
          id={id}
          name={nombre}
          value={valor}
          onChange={alCambiar}
          rows={3}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? idError : undefined}
          {...resto}
        />
        {error && (
          <p id={idError} className="campo__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
