// Estado de un formulario controlado: valores, errores y un unico manejador de cambios que usa
// el atributo name de cada campo. Al escribir en un campo se borra su error.

import { useCallback, useState } from "react";

export function useFormulario(valoresIniciales) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});

  const alCambiar = useCallback((evento) => {
    const { name, value } = evento.target;
    setValores((anteriores) => ({ ...anteriores, [name]: value }));
    setErrores((anteriores) => {
      if (!anteriores[name]) return anteriores;
      const { [name]: _quitado, ...resto } = anteriores;
      return resto;
    });
  }, []);

  return { valores, errores, alCambiar, establecerErrores: setErrores };
}
