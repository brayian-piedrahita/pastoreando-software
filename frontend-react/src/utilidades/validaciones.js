// Validaciones de los formularios. Reflejan las reglas de la API para avisar antes de enviar,
// pero la API sigue validando por su cuenta y su mensaje se muestra si hay diferencias.
// Cada funcion devuelve un objeto { campo: mensaje }; vacio significa que no hay errores.

import { ROLES, requiereCodigoProfesional } from "./permisos.js";

const PATRON_CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
// \p{L} cubre cualquier letra (con tildes y enie) sin escribirlas en el codigo.
const PATRON_LETRAS = /^[\p{L} .'-]+$/u;
const PATRON_CEDULA = /^\d{6,12}$/;
const PATRON_CLAVE_LETRA = /\p{L}/u;
const PATRON_CLAVE_NUMERO = /\d/;

export const PROPOSITOS = ["Carne", "Leche", "Doble Proposito"];

function textoVacio(valor) {
  return typeof valor !== "string" || valor.trim() === "";
}

function validarCorreo(valor) {
  if (textoVacio(valor)) return "El correo es obligatorio";
  if (!PATRON_CORREO.test(valor.trim())) return "Escriba un correo válido, por ejemplo nombre@dominio.co";
  return null;
}

// `plural` cambia la concordancia de los mensajes: "El nombre es..." frente a "Los apellidos son...".
function validarNombrePersona(valor, sujeto, plural = false) {
  const es = plural ? "son" : "es";
  if (textoVacio(valor)) return `${sujeto} ${es} obligatorio${plural ? "s" : ""}`;
  const texto = valor.trim();
  if (texto.length < 2) return `${sujeto} ${plural ? "deben" : "debe"} tener al menos 2 caracteres`;
  if (texto.length > 60) return `${sujeto} ${plural ? "no pueden" : "no puede"} superar 60 caracteres`;
  if (!PATRON_LETRAS.test(texto)) return `${sujeto} solo ${plural ? "admiten" : "admite"} letras`;
  return null;
}

// Copia al objeto de errores solo los mensajes que existen.
function recolectar(pares) {
  const errores = {};
  for (const [campo, mensaje] of pares) {
    if (mensaje) errores[campo] = mensaje;
  }
  return errores;
}

export function validarLogin({ correo, contrasena }) {
  return recolectar([
    ["correo", validarCorreo(correo)],
    ["contrasena", textoVacio(contrasena) ? "La contraseña es obligatoria" : null],
  ]);
}

export function validarContrasenaNueva(valor) {
  if (typeof valor !== "string" || valor.length === 0) return "La contraseña es obligatoria";
  if (valor.length < 8) return "Debe tener al menos 8 caracteres";
  if (valor.length > 72) return "No puede superar 72 caracteres";
  if (!PATRON_CLAVE_LETRA.test(valor) || !PATRON_CLAVE_NUMERO.test(valor)) {
    return "Debe combinar letras y números";
  }
  return null;
}

export function validarRegistro(valores) {
  const { nombre, apellidos, cedula, rol, correo, contrasena, codigo_profesional } = valores;

  let errorCedula = null;
  if (textoVacio(cedula)) errorCedula = "La cédula es obligatoria";
  else if (!PATRON_CEDULA.test(cedula.trim())) errorCedula = "Debe tener entre 6 y 12 dígitos";

  let errorRol = null;
  if (textoVacio(rol)) errorRol = "Seleccione un rol";
  else if (!ROLES.includes(rol)) errorRol = "Seleccione un rol de la lista";

  let errorCodigo = null;
  if (requiereCodigoProfesional(rol) && textoVacio(codigo_profesional)) {
    errorCodigo = "Este rol requiere el código de profesional";
  }

  return recolectar([
    ["nombre", validarNombrePersona(nombre, "El nombre")],
    ["apellidos", validarNombrePersona(apellidos, "Los apellidos", true)],
    ["cedula", errorCedula],
    ["rol", errorRol],
    ["correo", validarCorreo(correo)],
    ["contrasena", validarContrasenaNueva(contrasena)],
    ["codigo_profesional", errorCodigo],
  ]);
}

// Campo y mensaje cuando viene vacio (con la concordancia de genero y numero correcta).
const CAMPOS_VALOR = [
  ["alimentacion", "La alimentación es obligatoria"],
  ["mantenimiento", "El mantenimiento es obligatorio"],
  ["servicios", "Los servicios son obligatorios"],
  ["impuestos", "Los impuestos son obligatorios"],
];

export function validarCosto(valores) {
  const pares = [];

  for (const [campo, mensajeVacio] of CAMPOS_VALOR) {
    const texto = String(valores[campo] ?? "").trim();
    let mensaje = null;
    if (texto === "") mensaje = mensajeVacio;
    else if (!Number.isFinite(Number(texto))) mensaje = "Debe ser un número";
    else if (Number(texto) < 0) mensaje = "Debe ser mayor o igual a 0";
    pares.push([campo, mensaje]);
  }

  const animales = String(valores.cantidad_animales ?? "").trim();
  let errorAnimales = null;
  if (animales === "") errorAnimales = "La cantidad de animales es obligatoria";
  else if (!/^\d+$/.test(animales)) errorAnimales = "Debe ser un número entero";
  else if (Number(animales) < 1) errorAnimales = "Debe ser mayor o igual a 1";
  pares.push(["cantidad_animales", errorAnimales]);

  pares.push(["proposito", PROPOSITOS.includes(valores.proposito) ? null : "Seleccione un propósito"]);

  return recolectar(pares);
}
