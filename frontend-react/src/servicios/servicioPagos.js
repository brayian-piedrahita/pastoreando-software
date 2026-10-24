// Servicios de pagos de un contrato: el arrendatario registra y el propietario o el contador
// confirman o rechazan. La API valida el rol y el estado, aqui solo se arma la solicitud.

import { solicitar } from "./clienteApi.js";

export function listarPagos(idContrato) {
  return solicitar(`/api/contratos/${idContrato}/pagos`);
}

export function registrarPago(idContrato, valores) {
  return solicitar(`/api/contratos/${idContrato}/pagos`, {
    metodo: "POST",
    cuerpo: {
      fecha_pago: valores.fecha_pago,
      monto_total: Number(valores.monto_total),
      metodo_pago: valores.metodo_pago,
    },
  });
}

/** estadoPago: "Confirmado" o "Rechazado". */
export function resolverPago(idPago, estadoPago) {
  return solicitar(`/api/pagos/${idPago}/estado`, {
    metodo: "PUT",
    cuerpo: { estado_pago: estadoPago },
  });
}
