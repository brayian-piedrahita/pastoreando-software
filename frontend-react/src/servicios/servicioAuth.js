// Servicios de autenticacion: POST /api/auth/login y POST /api/auth/registro.

import { solicitar } from "./clienteApi.js";

/** Devuelve { token, usuario } cuando las credenciales son correctas. */
export async function iniciarSesion(correo, contrasena) {
  const datos = await solicitar("/api/auth/login", {
    metodo: "POST",
    cuerpo: { correo: correo.trim(), contrasena },
    conSesion: false,
  });
  return { token: datos.token, usuario: datos.usuario };
}

/** Registra un usuario. El codigo de profesional solo aplica a Tecnico y Contador. */
export async function registrarUsuario(valores) {
  const codigo = (valores.codigo_profesional ?? "").trim();
  const datos = await solicitar("/api/auth/registro", {
    metodo: "POST",
    conSesion: false,
    cuerpo: {
      nombre: valores.nombre.trim(),
      apellidos: valores.apellidos.trim(),
      cedula: valores.cedula.trim(),
      rol: valores.rol,
      correo: valores.correo.trim(),
      contrasena: valores.contrasena,
      codigo_profesional: codigo === "" ? null : codigo,
    },
  });
  return datos.usuario;
}
