import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MedidorCargaClase } from "../ejemplos/clases/MedidorCargaClase.jsx";
import { MedidorCargaFuncion } from "../ejemplos/clases/MedidorCargaFuncion.jsx";

// Las mismas pruebas se ejecutan sobre la version de clase y la de funcion:
// si las dos pasan, las dos formas de escribir el componente son equivalentes.
describe.each([
  ["componente de clase", MedidorCargaClase],
  ["componente de funcion", MedidorCargaFuncion],
])("Medidor de carga como %s", (nombre, Medidor) => {
  const propiedades = { nombreLote: "Lote El Rosal", capacidad: 10, cabezasIniciales: 7 };

  it("muestra el estado inicial calculado desde las propiedades", () => {
    const { container } = render(<Medidor {...propiedades} />);

    expect(container.querySelector(".medidor-detalle")).toHaveTextContent(
      "7 de 10 cabezas (70 %)",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Estado: NORMAL");
  });

  it("cambia de NORMAL a ALERTA y a SOBRECARGA al agregar cabezas", async () => {
    const usuario = userEvent.setup();
    render(<Medidor {...propiedades} />);

    await usuario.click(screen.getByRole("button", { name: "Agregar cabeza" })); // 8 -> 80 %
    expect(screen.getByRole("status")).toHaveTextContent("NORMAL");

    await usuario.click(screen.getByRole("button", { name: "Agregar cabeza" })); // 9 -> 90 %
    expect(screen.getByRole("status")).toHaveTextContent("ALERTA");

    await usuario.click(screen.getByRole("button", { name: "Agregar cabeza" })); // 10 -> 100 %
    await usuario.click(screen.getByRole("button", { name: "Agregar cabeza" })); // 11 -> 110 %
    expect(screen.getByRole("status")).toHaveTextContent("SOBRECARGA");
  });

  it("no baja de cero cabezas", async () => {
    const usuario = userEvent.setup();
    const { container } = render(<Medidor {...propiedades} cabezasIniciales={1} />);

    await usuario.click(screen.getByRole("button", { name: "Quitar cabeza" }));
    await usuario.click(screen.getByRole("button", { name: "Quitar cabeza" }));

    expect(container.querySelector(".medidor-detalle")).toHaveTextContent("0 de 10");
  });

  it("actualiza el titulo del documento y lo restaura al desmontar", async () => {
    const usuario = userEvent.setup();
    const { unmount } = render(<Medidor {...propiedades} />);
    expect(document.title).toBe("Pastoreando - carga 70%");

    await usuario.click(screen.getByRole("button", { name: "Agregar cabeza" }));
    expect(document.title).toBe("Pastoreando - carga 80%");

    unmount();
    expect(document.title).toBe("Pastoreando");
  });
});
