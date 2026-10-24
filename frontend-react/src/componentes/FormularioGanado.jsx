// Captura y valida un hato nuevo (raza, cantidad de cabezas y proposito). No llama a la API:
// entrega los valores con alGuardar y la seccion decide que hacer con ellos.

import { useFormulario } from "../hooks/useFormulario.js";
import { PROPOSITOS, validarGanado } from "../utilidades/validaciones.js";
import Boton from "./Boton.jsx";
import CampoFormulario from "./CampoFormulario.jsx";
import CampoSeleccion from "./CampoSeleccion.jsx";

const VALORES_INICIALES = { raza: "", cantidad_cabezas: "", proposito: "Carne" };
const TEXTO_PROPOSITO = { "Doble Proposito": "Doble Propósito" };
const OPCIONES = PROPOSITOS.map((valor) => ({ valor, texto: TEXTO_PROPOSITO[valor] ?? valor }));

export default function FormularioGanado({ cargando = false, erroresServidor = {}, alGuardar }) {
  const { valores, errores, alCambiar, establecerErrores } = useFormulario(VALORES_INICIALES);

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const encontrados = validarGanado(valores);
    establecerErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    // La seccion devuelve true cuando el hato se guardo: solo entonces se limpia el formulario.
    if (await alGuardar(valores)) {
      alCambiar({ target: { name: "raza", value: "" } });
      alCambiar({ target: { name: "cantidad_cabezas", value: "" } });
    }
  };

  const errorDe = (campo) => errores[campo] ?? erroresServidor[campo];

  return (
    <form className="formulario formulario--compacto" onSubmit={alEnviar} noValidate aria-label="Registrar ganado">
      <CampoFormulario etiqueta="Raza" nombre="raza" icono="animal" valor={valores.raza}
        error={errorDe("raza")} alCambiar={alCambiar} />
      <CampoFormulario etiqueta="Cantidad de cabezas" nombre="cantidad_cabezas" icono="lista"
        valor={valores.cantidad_cabezas} error={errorDe("cantidad_cabezas")} tipo="number" min="1" step="1"
        inputMode="numeric" alCambiar={alCambiar} />
      <CampoSeleccion etiqueta="Propósito" nombre="proposito" icono="hoja" valor={valores.proposito}
        alCambiar={alCambiar} opciones={OPCIONES} error={errorDe("proposito")} />
      <Boton tipo="submit" cargando={cargando} icono="animal">
        REGISTRAR GANADO
      </Boton>
    </form>
  );
}
