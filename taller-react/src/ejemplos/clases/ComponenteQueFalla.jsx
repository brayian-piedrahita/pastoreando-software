// Componente de prueba que falla a proposito para mostrar el limite de error.
export function ComponenteQueFalla({ fallar }) {
  if (fallar) {
    throw new Error("Fallo simulado de renderizado");
  }
  return <p>El componente se muestra sin problemas.</p>;
}
