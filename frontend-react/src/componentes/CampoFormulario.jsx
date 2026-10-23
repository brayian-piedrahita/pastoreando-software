// Campo de texto controlado con etiqueta, icono y mensaje de error. Es el componente mas repetido:
// la validacion visual y el estilo se cambian en un solo lugar.

import Icono from "./Icono.jsx";

export default function CampoFormulario({
  etiqueta,
  nombre,
  tipo = "text",
  valor,
  alCambiar,
  error,
  icono,
  accion,
  ...resto
}) {
  const id = `campo-${nombre}`;
  const idError = `${id}-error`;

  return (
    <div className={`campo${error ? " campo--error" : ""}`}>
      {icono && <Icono nombre={icono} className="campo__icono" />}
      <div className="campo__cuerpo">
        <label htmlFor={id}>{etiqueta}</label>
        <div className="campo__entrada">
          <input
            id={id}
            name={nombre}
            type={tipo}
            value={valor}
            onChange={alCambiar}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? idError : undefined}
            {...resto}
          />
          {accion}
        </div>
        {error && (
          <p id={idError} className="campo__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
