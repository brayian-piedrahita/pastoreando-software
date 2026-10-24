// Roles de la API y permisos que la interfaz refleja. La API sigue siendo la autoridad:
// aqui solo se evita ofrecer opciones que el servidor va a rechazar con 403.

export const ROLES = ["Propietario", "Arrendatario", "Tecnico", "Contador"];

// Roles que se registran con un codigo de profesional entregado por la administracion.
export const ROLES_PROFESIONALES = ["Tecnico", "Contador"];

// La API permite calcular costos a estos roles (el tecnico recibe 403).
export const ROLES_COSTOS = ["Propietario", "Arrendatario", "Contador"];

export function puedeCalcularCostos(rol) {
  return ROLES_COSTOS.includes(rol);
}

export function requiereCodigoProfesional(rol) {
  return ROLES_PROFESIONALES.includes(rol);
}

// Los roles que cada accion exige en la API (403 para los demas). La interfaz solo oculta
// lo que el servidor va a rechazar; la autoridad sigue siendo la API.
export const ROLES_REPORTES = ["Propietario", "Contador"];
export const ROLES_FIRMA = ["Propietario", "Arrendatario"];

export function puedeVerReportes(rol) {
  return ROLES_REPORTES.includes(rol);
}

export function puedeFirmar(rol) {
  return ROLES_FIRMA.includes(rol);
}

export function puedeRegistrarGanado(rol) {
  return rol === "Arrendatario";
}

export function puedeRegistrarPago(rol) {
  return rol === "Arrendatario";
}

export function puedeResolverPagos(rol) {
  return rol === "Propietario" || rol === "Contador";
}

export function puedeRecomendar(rol) {
  return rol === "Tecnico";
}
