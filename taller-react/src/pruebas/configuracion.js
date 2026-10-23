// Configuracion comun de las pruebas: agrega los validadores de jest-dom
// (toBeInTheDocument, toHaveTextContent...) y limpia el DOM entre pruebas.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  document.title = "";
});
