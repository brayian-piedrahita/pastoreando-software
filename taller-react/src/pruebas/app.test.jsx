import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../App.jsx";

describe("App del taller", () => {
  it("muestra las tres secciones del taller", () => {
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Pastoreando" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /React y JSX/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Clases en React/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Eventos de React/ })).toBeInTheDocument();
  });

  it("alterna entre el medidor de clase y el de funcion", async () => {
    const usuario = userEvent.setup();
    render(<App />);
    const botonClase = screen.getByRole("button", { name: "Componente de clase" });
    const botonFuncion = screen.getByRole("button", { name: /Componente de funci/ });

    expect(botonClase).toHaveAttribute("aria-pressed", "true");

    await usuario.click(botonFuncion);

    expect(botonFuncion).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Estado: NORMAL");
  });

  it("registra un hato desde el formulario y lo lista", async () => {
    const usuario = userEvent.setup();
    render(<App />);

    await usuario.type(screen.getByLabelText("Raza"), "Brahman");
    await usuario.type(screen.getByLabelText("Cantidad de cabezas"), "12");
    await usuario.selectOptions(screen.getByLabelText(/^Prop/), "Carne");
    await usuario.click(screen.getByRole("button", { name: "Registrar hato" }));

    expect(screen.getByRole("list", { name: "Hatos registrados" })).toHaveTextContent(
      "12 cabezas de Brahman (Carne)",
    );
  });
});
