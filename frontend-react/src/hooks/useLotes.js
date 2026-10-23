// Consulta los lotes del usuario y conserva la ultima respuesta en la copia local. Si no hay
// red, entrega esa copia (desdeCache) para que el monitoreo siga disponible en el campo (RNF01).
// Al recuperar la conexion vuelve a consultar solo.

import { useCallback, useEffect, useState } from "react";
import { CLAVES, guardar, leer } from "../servicios/almacenLocal.js";
import { ErrorRed } from "../servicios/clienteApi.js";
import { listarLotes } from "../servicios/servicioLotes.js";
import { useConexion } from "./useConexion.js";
import { useSesion } from "./useSesion.js";

const ESTADO_INICIAL = { lotes: [], cargando: true, error: null, desdeCache: false };

export function useLotes() {
  const { usuario } = useSesion();
  const enLinea = useConexion();
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [version, setVersion] = useState(0);
  const idUsuario = usuario?.id_usuario;

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let vigente = true;
    setEstado((anterior) => ({ ...anterior, cargando: true, error: null }));

    listarLotes()
      .then((lotes) => {
        guardar(CLAVES.LOTES, { idUsuario, lotes });
        if (vigente) setEstado({ lotes, cargando: false, error: null, desdeCache: false });
      })
      .catch((error) => {
        if (!vigente) return;
        if (error instanceof ErrorRed) {
          const copia = leer(CLAVES.LOTES);
          // La copia solo sirve si pertenece al usuario que tiene la sesion abierta.
          if (copia && copia.idUsuario === idUsuario) {
            setEstado({ lotes: copia.lotes, cargando: false, error: null, desdeCache: true });
            return;
          }
        }
        setEstado({ lotes: [], cargando: false, error, desdeCache: false });
      });

    return () => {
      vigente = false;
    };
  }, [idUsuario, version, enLinea]);

  return { ...estado, sinConexion: estado.error instanceof ErrorRed, recargar };
}
