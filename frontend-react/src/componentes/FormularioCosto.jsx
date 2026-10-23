// Captura y valida los datos del calculo (RF01): cuatro rubros, cantidad de animales y proposito.
// No llama a la API: entrega los valores con alCalcular y la pagina decide que hacer con ellos.

import { useFormulario } from "../hooks/useFormulario.js";
import { validarCosto } from "../utilidades/validaciones.js";
import Boton from "./Boton.jsx";
import CampoFormulario from "./CampoFormulario.jsx";
import CampoSeleccion from "./CampoSeleccion.jsx";

const VALORES_INICIALES = {
  alimentacion: "",
  mantenimiento: "",
  servicios: "",
  impuestos: "",
  cantidad_animales: "",
  proposito: "Carne",
};

export default function FormularioCosto({ propositos, cargando = false, erroresServidor = {}, alCalcular }) {
  const { valores, errores, alCambiar, establecerErrores } = useFormulario(VALORES_INICIALES);

  const alEnviar = (evento) => {
    evento.preventDefault();
    const encontrados = validarCosto(valores);
    establecerErrores(encontrados);
    if (Object.keys(encontrados).length === 0) alCalcular(valores);
  };

  const errorDe = (campo) => errores[campo] ?? erroresServidor[campo];
  const numero = { tipo: "number", min: "0", step: "any", inputMode: "decimal", alCambiar };

  return (
    <form className="formulario formulario--costo" onSubmit={alEnviar} noValidate>
      <p className="formulario__ayuda">Ingrese los valores del lote por categoría (RF01):</p>
      <CampoFormulario etiqueta="Alimentación ($)" nombre="alimentacion" icono="hoja"
        valor={valores.alimentacion} error={errorDe("alimentacion")} {...numero} />
      <CampoFormulario etiqueta="Mantenimiento ($)" nombre="mantenimiento" icono="llave"
        valor={valores.mantenimiento} error={errorDe("mantenimiento")} {...numero} />
      <CampoFormulario etiqueta="Servicios ($)" nombre="servicios" icono="gota"
        valor={valores.servicios} error={errorDe("servicios")} {...numero} />
      <CampoFormulario etiqueta="Impuestos ($)" nombre="impuestos" icono="recibo"
        valor={valores.impuestos} error={errorDe("impuestos")} {...numero} />
      <CampoFormulario etiqueta="Cantidad de animales" nombre="cantidad_animales" icono="lista"
        valor={valores.cantidad_animales} error={errorDe("cantidad_animales")} tipo="number" min="1" step="1"
        inputMode="numeric" alCambiar={alCambiar} />
      <CampoSeleccion etiqueta="Propósito del ganado" nombre="proposito" icono="animal"
        valor={valores.proposito} alCambiar={alCambiar} opciones={propositos} error={errorDe("proposito")} />
      <Boton tipo="submit" cargando={cargando} icono="calculadora">
        CALCULAR COSTOS
      </Boton>
    </form>
  );
}
