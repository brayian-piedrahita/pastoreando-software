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
