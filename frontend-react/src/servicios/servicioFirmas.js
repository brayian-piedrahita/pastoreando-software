// Servicios de la firma digital del contrato (RF05): consulta quienes firmaron el texto vigente
// y registra la firma del usuario con la huella SHA-256 del documento.

import { solicitar } from "./clienteApi.js";

export function consultarFirmas(idContrato) {
  return solicitar(`/api/contratos/${idContrato}/firmas`);
}

export function firmarContrato(idContrato) {
  return solicitar(`/api/contratos/${idContrato}/firma`, { metodo: "POST" });
}
