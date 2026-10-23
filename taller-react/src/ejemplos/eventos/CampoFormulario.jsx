// Envoltorio reutilizable de un campo de formulario: etiqueta, control y error.
// El control se recibe como children (composicion de componentes).
export function CampoFormulario({ id, etiqueta, error, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error && (
        <p id={`error-${id}`} className="error-campo" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
