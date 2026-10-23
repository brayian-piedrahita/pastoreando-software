// Indicador de espera hecho solo con CSS. Se anuncia a los lectores de pantalla con role=status.

export default function IndicadorCarga({ etiqueta = "Cargando", pequeno = false }) {
  return (
    <span className={`indicador-carga${pequeno ? " indicador-carga--pequeno" : ""}`} role="status">
      <span className="indicador-carga__giro" aria-hidden="true" />
      <span className="solo-lectores">{etiqueta}</span>
    </span>
  );
}
