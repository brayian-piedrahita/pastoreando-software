import { describe, expect, it } from "vitest";
import { formatoMoneda, formatoNumero, formatoPorcentaje } from "../utilidades/formato.js";

describe("formatoMoneda", () => {
  it("usa el formato colombiano con dos decimales", () => {
    expect(formatoMoneda(288000)).toBe("$ 288.000,00");
    expect(formatoMoneda(14400000)).toBe("$ 14.400.000,00");
  });

  it("devuelve una raya cuando no hay valor", () => {
    expect(formatoMoneda(undefined)).toBe("—");
    expect(formatoMoneda(NaN)).toBe("—");
  });
});

describe("formatoPorcentaje y formatoNumero", () => {
  it("usa coma decimal y un decimal como maximo", () => {
    expect(formatoPorcentaje(86.7)).toBe("86,7 %");
    expect(formatoPorcentaje(120)).toBe("120 %");
    expect(formatoNumero(12.5)).toBe("12,5");
  });

  it("devuelve una raya cuando no hay valor", () => {
    expect(formatoPorcentaje(null)).toBe("—");
    expect(formatoNumero(undefined)).toBe("—");
  });
});
