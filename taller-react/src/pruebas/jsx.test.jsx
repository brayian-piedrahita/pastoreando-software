import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TarjetaLote } from "../ejemplos/jsx/TarjetaLote.jsx";
import { TarjetaLoteSinJsx } from "../ejemplos/jsx/TarjetaLoteSinJsx.js";

const DATOS = { nombre: "Lote La Esperanza", hectareas: 12, estado: "ALERTA" };

describe("JSX es otra forma de escribir createElement", () => {
  it("la tarjeta con JSX y la tarjeta sin JSX producen el mismo HTML", () => {
    const conJsx = render(<TarjetaLote {...DATOS} />);
    const sinJsx = render(<TarjetaLoteSinJsx {...DATOS} />);

    expect(conJsx.container.innerHTML).toBe(sinJsx.container.innerHTML);
  });

  it("muestra el nombre, las hectareas y la insignia del estado", () => {
    const { container } = render(<TarjetaLote {...DATOS} />);

    expect(container.querySelector("h3")).toHaveTextContent("Lote La Esperanza");
    expect(container.querySelector("p")).toHaveTextContent("12 ha");
    expect(container.querySelector(".insignia")).toHaveClass("insignia-alerta");
  });

  it("className de JSX se convierte en el atributo class del HTML", () => {
    const { container } = render(<TarjetaLote {...DATOS} />);

    expect(container.querySelector("article")).toHaveAttribute("class", "tarjeta-lote");
  });
});
