import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LaboratorioEventos } from "../ejemplos/eventos/LaboratorioEventos.jsx";

// Devuelve los textos de la lista de registro, del mas reciente al mas antiguo
function leerRegistro() {
  const lista = screen.getByRole("list", { name: "Registro de eventos" });
  return within(lista)
    .queryAllByRole("listitem")
    .map((elemento) => elemento.textContent);
}

describe("LaboratorioEventos", () => {
  it("onClick: registra el clic en el boton", async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioEventos />);

    await usuario.click(screen.getByRole("button", { name: "Registrar clic" }));

    expect(leerRegistro()[0]).toMatch(/^onClick/);
  });

  it("onChange y onKeyDown: se disparan al escribir y el campo queda controlado", async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioEventos />);
    const campo = screen.getByLabelText("Escriba algo para disparar eventos");

    await usuario.type(campo, "a");

    const registro = leerRegistro();
    expect(registro.some((linea) => linea.startsWith("onKeyDown") && linea.includes("tecla: a"))).toBe(true);
    expect(registro.some((linea) => linea.startsWith("onChange") && linea.includes('valor: "a"'))).toBe(true);
    expect(campo).toHaveValue("a");
  });

  it("onFocus y onBlur: se disparan al entrar y salir del campo", async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioEventos />);

    await usuario.click(screen.getByLabelText("Escriba algo para disparar eventos"));
    await usuario.click(screen.getByRole("button", { name: "Registrar clic" }));

    const tipos = leerRegistro().map((linea) => linea.split(" ")[0]);
    expect(tipos).toContain("onFocus");
    expect(tipos).toContain("onBlur");
  });

  it("onSubmit: usa preventDefault y no deja que el navegador envie el formulario", async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioEventos />);
    const formulario = screen.getByRole("button", { name: "Enviar formulario" }).closest("form");

    // fireEvent devuelve false cuando algun manejador llamo a preventDefault
    const noCancelado = fireEvent.submit(formulario);
    expect(noCancelado).toBe(false);

    await usuario.click(screen.getByRole("button", { name: "Enviar formulario" }));
    expect(leerRegistro()[0]).toMatch(/^onSubmit/);
  });

  it("onDoubleClick, onMouseEnter, onMouseLeave y onTouchStart sobre la zona", async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioEventos />);
    const zona = screen.getByText(/Pase el cursor/);

    await usuario.hover(zona);
    await usuario.dblClick(zona);
    fireEvent.touchStart(zona);
    await usuario.unhover(zona);

    const tipos = leerRegistro().map((linea) => linea.split(" ")[0]);
    expect(tipos).toEqual(
      expect.arrayContaining(["onMouseEnter", "onDoubleClick", "onTouchStart", "onMouseLeave"]),
    );
  });

  it("conserva solo los ultimos 8 eventos", async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioEventos />);
    const boton = screen.getByRole("button", { name: "Registrar clic" });

    for (let i = 0; i < 12; i += 1) {
      await usuario.click(boton);
    }

    expect(leerRegistro()).toHaveLength(8);
  });
});
