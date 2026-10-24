// Contexto de la sesion: token y usuario. Se guarda en localStorage para sobrevivir a una
// recarga de la pagina y se limpia cuando el usuario cierra sesion o la API responde 401.

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { CLAVES, borrar, guardar, leer } from "../servicios/almacenLocal.js";
import { EVENTO_SESION_EXPIRADA } from "../servicios/clienteApi.js";
import { iniciarSesion as pedirSesion } from "../servicios/servicioAuth.js";

export const ContextoSesion = createContext(null);

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(() => leer(CLAVES.SESION));

  const iniciarSesion = useCallback(async (correo, contrasena) => {
    const nueva = await pedirSesion(correo, contrasena);
    guardar(CLAVES.SESION, nueva);
    setSesion(nueva);
    return nueva.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    borrar(CLAVES.SESION);
    // Las copias locales pertenecen a este usuario: no deben quedar para el siguiente.
    borrar(CLAVES.LOTES);
    borrar(CLAVES.CONTRATOS);
    borrar(CLAVES.REPORTE);
    setSesion(null);
  }, []);

  // El cliente de la API avisa con un evento cuando el token vencio (401).
  useEffect(() => {
    const alExpirar = () => setSesion(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const valor = useMemo(
    () => ({
      token: sesion?.token ?? null,
      usuario: sesion?.usuario ?? null,
      iniciarSesion,
      cerrarSesion,
    }),
    [sesion, iniciarSesion, cerrarSesion],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}
