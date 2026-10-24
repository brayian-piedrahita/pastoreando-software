// Consulta a la API con estado de carga y error. Si se indica `clave`, guarda la ultima respuesta
// en la copia local del usuario y la entrega cuando no hay red (desdeCache), para que el trabajo
// en el campo siga disponible (RNF01). Al recuperar la conexion vuelve a consultar solo.

import { useCallback, useEffect, useRef, useState } from "react";
import { guardar, leer } from "../servicios/almacenLocal.js";
import { ErrorRed } from "../servicios/clienteApi.js";
import { useConexion } from "./useConexion.js";
import { useSesion } from "./useSesion.js";

const ESTADO_INICIAL = { datos: null, cargando: true, error: null, desdeCache: false };

/**
 * @param {() => Promise<any>} consultar funcion que llama al servicio
 * @param {{clave?: string|null, dependencias?: any[]}} opciones `dependencias` fuerza una nueva
 *   consulta cuando cambia (por ejemplo el id de la ruta)
 */
export function useConsulta(consultar, { clave = null, dependencias = [] } = {}) {
  const { usuario } = useSesion();
  const enLinea = useConexion();
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [version, setVersion] = useState(0);
  const idUsuario = usuario?.id_usuario;

  // La funcion cambia en cada dibujo; se lee por referencia para no repetir la consulta.
  const ultima = useRef(consultar);
  ultima.current = consultar;

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let vigente = true;
    setEstado((anterior) => ({ ...anterior, cargando: true, error: null }));

    ultima
      .current()
      .then((datos) => {
        if (clave) guardar(clave, { idUsuario, datos });
        if (vigente) setEstado({ datos, cargando: false, error: null, desdeCache: false });
      })
      .catch((error) => {
        if (!vigente) return;
        if (error instanceof ErrorRed && clave) {
          const copia = leer(clave);
          // La copia solo sirve si pertenece al usuario que tiene la sesion abierta.
          if (copia && copia.idUsuario === idUsuario) {
            setEstado({ datos: copia.datos, cargando: false, error: null, desdeCache: true });
            return;
          }
        }
        setEstado({ datos: null, cargando: false, error, desdeCache: false });
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario, version, enLinea, clave, ...dependencias]);

  return { ...estado, sinConexion: estado.error instanceof ErrorRed, recargar };
}
