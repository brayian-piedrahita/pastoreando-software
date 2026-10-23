import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ComponenteQueFalla } from "../ejemplos/clases/ComponenteQueFalla.jsx";
import { DemoLimiteError } from "../ejemplos/clases/DemoLimiteError.jsx";
import { LimiteError } from "../ejemplos/clases/LimiteError.jsx";

describe("LimiteError (componente de clase)", () => {
  beforeEach(() => {
    // React escribe el error en la consola aunque este capturado; se silencia en la prueba
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deja pasar a los hijos cuando no hay error", () => {
    render(
      <LimiteError>
        <ComponenteQueFalla fallar={false} />
      </LimiteError>,
    );

    expect(screen.getByText(/se muestra sin problemas/)).toBeInTheDocument();
  });

  it("muestra el aviso cuando un hijo falla y registra el error", () => {
    const alRegistrar = vi.fn();

    render(
      <LimiteError mensaje="Seccion aislada" alRegistrar={alRegistrar}>
        <ComponenteQueFalla fallar />
      </LimiteError>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Seccion aislada");
    expect(alRegistrar).toHaveBeenCalledTimes(1);
    expect(alRegistrar.mock.calls[0][0].message).toBe("Fallo simulado de renderizado");
  });

  it("la demostracion aisla el fallo y permite reiniciar", async () => {
    const usuario = userEvent.setup();
    render(<DemoLimiteError />);

    await usuario.click(screen.getByRole("button", { name: "Provocar fallo" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(/se muestra sin problemas/)).toBeInTheDocument();
  });
});
