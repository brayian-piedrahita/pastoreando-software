// Captura y valida un pago (fecha, monto y metodo). No llama a la API: entrega los valores con
// alGuardar y la seccion decide que hacer con ellos. El pago queda Pendiente hasta que lo resuelva
// el propietario o el contador.

import { useFormulario } from "../hooks/useFormulario.js";
import { METODOS_PAGO, TEXTO_METODO, validarPago } from "../utilidades/validaciones.js";
import Boton from "./Boton.jsx";
import CampoFormulario from "./CampoFormulario.jsx";
import CampoSeleccion from "./CampoSeleccion.jsx";

const VALORES_INICIALES = { fecha_pago: "", monto_total: "", metodo_pago: "Transferencia" };
const OPCIONES = METODOS_PAGO.map((valor) => ({ valor, texto: TEXTO_METODO[valor] ?? valor }));

export default function FormularioPago({ cargando = false, erroresServidor = {}, alGuardar }) {
  const { valores, errores, alCambiar, establecerErrores } = useFormulario(VALORES_INICIALES);

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const encontrados = validarPago(valores);
    establecerErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    if (await alGuardar(valores)) {
      alCambiar({ target: { name: "fecha_pago", value: "" } });
      alCambiar({ target: { name: "monto_total", value: "" } });
    }
  };

  const errorDe = (campo) => errores[campo] ?? erroresServidor[campo];

  return (
    <form className="formulario formulario--compacto" onSubmit={alEnviar} noValidate aria-label="Registrar pago">
      <CampoFormulario etiqueta="Fecha del pago" nombre="fecha_pago" icono="recibo" tipo="date"
        valor={valores.fecha_pago} error={errorDe("fecha_pago")} alCambiar={alCambiar} />
      <CampoFormulario etiqueta="Monto ($)" nombre="monto_total" icono="moneda" tipo="number" min="0"
        step="any" inputMode="decimal" valor={valores.monto_total} error={errorDe("monto_total")}
        alCambiar={alCambiar} />
      <CampoSeleccion etiqueta="Método de pago" nombre="metodo_pago" icono="tarjeta" valor={valores.metodo_pago}
        alCambiar={alCambiar} opciones={OPCIONES} error={errorDe("metodo_pago")} />
      <Boton tipo="submit" cargando={cargando} icono="moneda">
        REGISTRAR PAGO
      </Boton>
    </form>
  );
}
