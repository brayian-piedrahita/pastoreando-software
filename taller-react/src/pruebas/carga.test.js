import { describe, expect, it } from "vitest";
import { calcularEstadoCarga } from "../utilidades/carga.js";

describe("calcularEstadoCarga (regla RF04)", () => {
  // [cabezas, capacidad, porcentaje, estado esperado]
  it.each([
    [0, 10, 0, "NORMAL"],
    [8, 10, 80, "NORMAL"], // 80 % exacto sigue en NORMAL
    [9, 10, 90, "ALERTA"],
    [10, 10, 100, "ALERTA"], // 100 % exacto todavia es ALERTA
    [11, 10, 110, "SOBRECARGA"],
    [81, 100, 81, "ALERTA"],
  ])("%i cabezas en capacidad %i -> porcentaje %i, estado %s", (cabezas, capacidad, porcentaje, estado) => {
    expect(calcularEstadoCarga(cabezas, capacidad)).toEqual({ porcentaje, estado });
  });

  it("rechaza capacidad cero o negativa", () => {
    expect(() => calcularEstadoCarga(5, 0)).toThrow(RangeError);
    expect(() => calcularEstadoCarga(5, -3)).toThrow(RangeError);
  });

  it("rechaza cabezas negativas o con decimales", () => {
    expect(() => calcularEstadoCarga(-1, 10)).toThrow(RangeError);
    expect(() => calcularEstadoCarga(2.5, 10)).toThrow(RangeError);
  });
});
