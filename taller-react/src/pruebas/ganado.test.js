import { describe, expect, it } from "vitest";
import { validarGanado } from "../utilidades/ganado.js";

const VALIDO = { raza: "Brahman", cantidadCabezas: "12", proposito: "Carne" };

describe("validarGanado", () => {
  it("acepta datos correctos", () => {
    expect(validarGanado(VALIDO)).toEqual({});
  });

  it("acepta razas con letras acentuadas y espacios", () => {
    // La secuencia de escape unicode representa la u con tilde y deja el archivo sin tildes
    expect(validarGanado({ ...VALIDO, raza: "Ceb\u00fa Criollo" })).toEqual({});
  });

  it.each(["", " ", "A", "Brahman2", "<b>Cebu</b>", "x".repeat(51)])(
    "rechaza la raza %j",
    (raza) => {
      expect(validarGanado({ ...VALIDO, raza })).toHaveProperty("raza");
    },
  );

  it.each(["", "0", "-4", "2.5", "abc"])("rechaza la cantidad %j", (cantidad) => {
    expect(validarGanado({ ...VALIDO, cantidadCabezas: cantidad })).toHaveProperty(
      "cantidadCabezas",
    );
  });

  it("rechaza un proposito que no existe", () => {
    expect(validarGanado({ ...VALIDO, proposito: "Tiro" })).toHaveProperty("proposito");
    expect(validarGanado({ ...VALIDO, proposito: "" })).toHaveProperty("proposito");
  });
});
