// Tarjeta de un lote escrita con JSX.
// Al compilar, cada etiqueta de JSX se convierte en una llamada a JavaScript
// (ver TarjetaLoteSinJsx.js, que produce exactamente el mismo resultado).

export function TarjetaLote({ nombre, hectareas, estado }) {
  return (
    <article className="tarjeta-lote">
      <h3>{nombre}</h3>
      <p>{hectareas} ha</p>
      <span className={`insignia insignia-${estado.toLowerCase()}`}>{estado}</span>
    </article>
  );
}
