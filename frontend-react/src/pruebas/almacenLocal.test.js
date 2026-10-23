import { afterEach, describe, expect, it, vi } from "vitest";
import { borrar, guardar, leer } from "../servicios/almacenLocal.js";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("almacenLocal", () => {
  it("guarda y lee valores JSON", () => {
    expect(guardar("clave", { a: 1 })).toBe(true);
    expect(leer("clave")).toEqual({ a: 1 });
  });

  it("devuelve el valor por defecto si la clave no existe o el JSON esta danado", () => {
    expect(leer("no-existe", "defecto")).toBe("defecto");
    window.localStorage.setItem("danado", "{no es json");
    expect(leer("danado", [])).toEqual([]);
  });

  it("borra una clave", () => {
    guardar("clave", 1);
    borrar("clave");
    expect(leer("clave")).toBeNull();
  });

  it("no lanza errores si el almacenamiento esta bloqueado", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("cuota llena");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(guardar("clave", 1)).toBe(false);
    expect(leer("clave", "respaldo")).toBe("respaldo");
  });
});
