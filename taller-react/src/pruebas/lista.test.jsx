import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ListaLotes } from "../ejemplos/jsx/ListaLotes.jsx";
import { LOTES_EJEMPLO } from "../utilidades/lotesEjemplo.js";

describe("ListaLotes (listas con map y key)", () => {
  it("muestra una tarjeta por cada lote", () => {
    render(<ListaLotes lotes={LOTES_EJEMPLO} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(LOTES_EJEMPLO.length);
  });

  it("filtra por estado con el campo controlado", async () => {
    const usuario = userEvent.setup();
    render(<ListaLotes lotes={LOTES_EJEMPLO} />);

    await usuario.selectOptions(screen.getByLabelText("Filtrar por estado"), "NORMAL");

    const elementos = screen.getAllByRole("listitem");
    expect(elementos).toHaveLength(2);
    elementos.forEach((elemento) => {
      expect(within(elemento).getByText("NORMAL")).toBeInTheDocument();
    });
  });

  it("muestra un mensaje cuando ningun lote cumple el filtro", async () => {
    const usuario = userEvent.setup();
    const soloNormales = LOTES_EJEMPLO.filter((lote) => lote.estado === "NORMAL");
    render(<ListaLotes lotes={soloNormales} />);

    await usuario.selectOptions(screen.getByLabelText("Filtrar por estado"), "SOBRECARGA");

    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByText(/No hay lotes/)).toBeInTheDocument();
  });
});
