import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IndicadorConexion } from "../ejemplos/eventos/IndicadorConexion.jsx";

describe("IndicadorConexion (eventos del navegador)", () => {
  it("no muestra nada mientras hay conexion", () => {
    render(<IndicadorConexion />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra la franja al perder la conexion y la oculta al recuperarla", () => {
    render(<IndicadorConexion />);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/^Sin conexi/);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("retira sus escuchas al desmontarse", () => {
    const retirar = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<IndicadorConexion />);

    unmount();

    const eventos = retirar.mock.calls.map((llamada) => llamada[0]);
    expect(eventos).toEqual(expect.arrayContaining(["online", "offline"]));
    retirar.mockRestore();
  });
});
