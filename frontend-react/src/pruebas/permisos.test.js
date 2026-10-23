import { describe, expect, it } from "vitest";
import { puedeCalcularCostos, requiereCodigoProfesional } from "../utilidades/permisos.js";

describe("permisos por rol", () => {
  it("el tecnico no calcula costos y los demas roles si", () => {
    expect(puedeCalcularCostos("Tecnico")).toBe(false);
    expect(puedeCalcularCostos("Propietario")).toBe(true);
    expect(puedeCalcularCostos("Arrendatario")).toBe(true);
    expect(puedeCalcularCostos("Contador")).toBe(true);
  });

  it("solo tecnico y contador se registran con codigo de profesional", () => {
    expect(requiereCodigoProfesional("Tecnico")).toBe(true);
    expect(requiereCodigoProfesional("Contador")).toBe(true);
    expect(requiereCodigoProfesional("Propietario")).toBe(false);
  });
});
