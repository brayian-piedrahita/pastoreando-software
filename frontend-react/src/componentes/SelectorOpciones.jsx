// Grupo de botones de radio. En el modulo contable alterna la vista del resultado entre costo
// por unidad ganadera y lote completo sin pedir nada nuevo al servidor.

export default function SelectorOpciones({ leyenda, nombre, opciones, valor, alCambiar }) {
  return (
    <fieldset className="selector-opciones">
      <legend>{leyenda}</legend>
      {opciones.map((opcion) => (
        <label key={opcion.valor} className="selector-opciones__opcion">
          <input
            type="radio"
            name={nombre}
            value={opcion.valor}
            checked={valor === opcion.valor}
            onChange={() => alCambiar(opcion.valor)}
          />
          <span>{opcion.texto}</span>
        </label>
      ))}
    </fieldset>
  );
}
