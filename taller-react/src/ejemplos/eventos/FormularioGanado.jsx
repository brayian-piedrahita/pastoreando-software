// Formulario controlado para registrar un hato de ganado.
// Cada campo toma su valor del estado y lo actualiza con onChange.
import { useState } from "react";
import {
  ETIQUETAS_PROPOSITO,
  PROPOSITOS,
  validarGanado,
} from "../../utilidades/ganado.js";
import { CampoFormulario } from "./CampoFormulario.jsx";

const DATOS_VACIOS = { raza: "", cantidadCabezas: "", proposito: "" };

export function FormularioGanado({ alRegistrar }) {
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [errores, setErrores] = useState({});

  // Un solo manejador para todos los campos: el atributo name indica cual cambia
  function alCambiar(evento) {
    const { name, value } = evento.target;
    setDatos((anteriores) => ({ ...anteriores, [name]: value }));
  }

  function alEnviar(evento) {
    evento.preventDefault(); // evita la recarga de la pagina
    const encontrados = validarGanado(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return; // hay errores: no se registra nada
    }
    alRegistrar({
      raza: datos.raza.trim(),
      cantidadCabezas: Number(datos.cantidadCabezas),
      proposito: datos.proposito,
    });
    setDatos(DATOS_VACIOS);
  }

  function alLimpiar() {
    setDatos(DATOS_VACIOS);
    setErrores({});
  }

  return (
    <form className="formulario" onSubmit={alEnviar} noValidate>
      <CampoFormulario id="raza" etiqueta="Raza" error={errores.raza}>
        <input
          id="raza"
          name="raza"
          type="text"
          value={datos.raza}
          onChange={alCambiar}
          aria-invalid={Boolean(errores.raza)}
        />
      </CampoFormulario>

      <CampoFormulario
        id="cantidadCabezas"
        etiqueta="Cantidad de cabezas"
        error={errores.cantidadCabezas}
      >
        <input
          id="cantidadCabezas"
          name="cantidadCabezas"
          type="number"
          min="1"
          value={datos.cantidadCabezas}
          onChange={alCambiar}
          aria-invalid={Boolean(errores.cantidadCabezas)}
        />
      </CampoFormulario>

      <CampoFormulario id="proposito" etiqueta="Propósito" error={errores.proposito}>
        <select
          id="proposito"
          name="proposito"
          value={datos.proposito}
          onChange={alCambiar}
          aria-invalid={Boolean(errores.proposito)}
        >
          <option value="">Seleccione...</option>
          {PROPOSITOS.map((proposito) => (
            <option key={proposito} value={proposito}>
              {ETIQUETAS_PROPOSITO[proposito]}
            </option>
          ))}
        </select>
      </CampoFormulario>

      <button type="submit" className="boton-principal">
        Registrar hato
      </button>
      <button type="button" onClick={alLimpiar}>
        Limpiar
      </button>
    </form>
  );
}
