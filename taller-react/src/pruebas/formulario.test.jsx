import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormularioGanado } from "../ejemplos/eventos/FormularioGanado.jsx";

async function llenar(usuario, { raza, cantidad, proposito }) {
  if (raza !== undefined) {
    await usuario.type(screen.getByLabelText("Raza"), raza);
  }
  if (cantidad !== undefined) {
    await usuario.type(screen.getByLabelText("Cantidad de cabezas"), cantidad);
  }
  if (proposito !== undefined) {
    await usuario.selectOptions(screen.getByLabelText(/^Prop/), proposito);
  }
}

describe("FormularioGanado (formulario controlado)", () => {
  it("registra el hato con datos validos y limpia el formulario", async () => {
    const usuario = userEvent.setup();
    const alRegistrar = vi.fn();
    render(<FormularioGanado alRegistrar={alRegistrar} />);

    await llenar(usuario, { raza: "  Brahman ", cantidad: "12", proposito: "Carne" });
    await usuario.click(screen.getByRole("button", { name: "Registrar hato" }));

    expect(alRegistrar).toHaveBeenCalledWith({
      raza: "Brahman",
      cantidadCabezas: 12,
      proposito: "Carne",
    });
    expect(screen.getByLabelText("Raza")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra un error por cada campo invalido y no registra", async () => {
    const usuario = userEvent.setup();
    const alRegistrar = vi.fn();
    render(<FormularioGanado alRegistrar={alRegistrar} />);

    await usuario.click(screen.getByRole("button", { name: "Registrar hato" }));

    expect(alRegistrar).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.getByLabelText("Raza")).toHaveAttribute("aria-invalid", "true");
  });

  it("rechaza cero cabezas (regla de la base: cantidad mayor que cero)", async () => {
    const usuario = userEvent.setup();
    const alRegistrar = vi.fn();
    render(<FormularioGanado alRegistrar={alRegistrar} />);

    await llenar(usuario, { raza: "Gyr", cantidad: "0", proposito: "Leche" });
    await usuario.click(screen.getByRole("button", { name: "Registrar hato" }));

    expect(alRegistrar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/mayor que cero/);
  });

  it("el boton Limpiar borra los datos y los errores", async () => {
    const usuario = userEvent.setup();
    render(<FormularioGanado alRegistrar={vi.fn()} />);

    await llenar(usuario, { raza: "A" });
    await usuario.click(screen.getByRole("button", { name: "Registrar hato" }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);

    await usuario.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(screen.getByLabelText("Raza")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
