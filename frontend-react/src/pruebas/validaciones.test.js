import { describe, expect, it } from "vitest";
import { validarContrasenaNueva, validarCosto, validarLogin, validarRegistro } from "../utilidades/validaciones.js";

const REGISTRO_VALIDO = {
  nombre: "Ana", apellidos: "Londoño Ruiz", cedula: "1112223334", rol: "Arrendatario",
  correo: "ana.londono@pastoreando.co", contrasena: "ClaveSegura2026", codigo_profesional: "",
};

describe("validarLogin", () => {
  it("acepta un correo y una contrasena", () => {
    expect(validarLogin({ correo: "a@b.co", contrasena: "x" })).toEqual({});
  });

  it("senala los campos vacios o con formato incorrecto", () => {
    expect(validarLogin({ correo: "", contrasena: "" })).toEqual({
      correo: "El correo es obligatorio",
      contrasena: "La contraseña es obligatoria",
    });
    expect(validarLogin({ correo: "sin-arroba", contrasena: "x" }).correo).toMatch(/correo válido/);
  });
});

describe("validarContrasenaNueva", () => {
  it.each([
    ["corta1", "Debe tener al menos 8 caracteres"],
    ["soloLetrasAqui", "Debe combinar letras y números"],
    ["12345678", "Debe combinar letras y números"],
    ["a1".repeat(40), "No puede superar 72 caracteres"],
  ])("rechaza %s", (clave, mensaje) => {
    expect(validarContrasenaNueva(clave)).toBe(mensaje);
  });

  it("acepta letras y numeros desde 8 caracteres", () => {
    expect(validarContrasenaNueva("Clave2026")).toBeNull();
  });
});

describe("validarRegistro", () => {
  it("acepta un registro completo de arrendatario", () => {
    expect(validarRegistro(REGISTRO_VALIDO)).toEqual({});
  });

  it("acepta tildes y enes en los nombres", () => {
    expect(validarRegistro({ ...REGISTRO_VALIDO, nombre: "José Ángel", apellidos: "Muñoz Peña" })).toEqual({});
  });

  it("rechaza numeros en el nombre y cedulas fuera de 6 a 12 digitos", () => {
    const errores = validarRegistro({ ...REGISTRO_VALIDO, nombre: "Ana3", cedula: "12345" });
    expect(errores.nombre).toBe("El nombre solo admite letras");
    expect(errores.cedula).toBe("Debe tener entre 6 y 12 dígitos");
  });

  it("exige el codigo de profesional solo a tecnico y contador", () => {
    expect(validarRegistro({ ...REGISTRO_VALIDO, rol: "Tecnico" }).codigo_profesional).toMatch(/código de profesional/);
    expect(validarRegistro({ ...REGISTRO_VALIDO, rol: "Contador", codigo_profesional: "ABC-1" })).toEqual({});
    expect(validarRegistro(REGISTRO_VALIDO).codigo_profesional).toBeUndefined();
  });

  it("usa la concordancia correcta en los apellidos", () => {
    expect(validarRegistro({ ...REGISTRO_VALIDO, apellidos: "" }).apellidos).toBe("Los apellidos son obligatorios");
  });

  it("rechaza un rol vacio o inexistente", () => {
    expect(validarRegistro({ ...REGISTRO_VALIDO, rol: "" }).rol).toBe("Seleccione un rol");
    expect(validarRegistro({ ...REGISTRO_VALIDO, rol: "Administrador" }).rol).toBe("Seleccione un rol de la lista");
  });
});

describe("validarCosto", () => {
  const COSTO_VALIDO = {
    alimentacion: "6000000", mantenimiento: "3000000", servicios: "1500000", impuestos: "1500000",
    cantidad_animales: "50", proposito: "Carne",
  };

  it("acepta valores correctos y el cero en un rubro", () => {
    expect(validarCosto(COSTO_VALIDO)).toEqual({});
    expect(validarCosto({ ...COSTO_VALIDO, servicios: "0" })).toEqual({});
  });

  it("rechaza vacios, negativos y textos", () => {
    const errores = validarCosto({ ...COSTO_VALIDO, alimentacion: "", mantenimiento: "-5", servicios: "abc" });
    expect(errores.alimentacion).toBe("La alimentación es obligatoria");
    expect(errores.mantenimiento).toBe("Debe ser mayor o igual a 0");
    expect(errores.servicios).toBe("Debe ser un número");
  });

  it("exige una cantidad de animales entera y mayor que cero", () => {
    expect(validarCosto({ ...COSTO_VALIDO, cantidad_animales: "0" }).cantidad_animales).toBe("Debe ser mayor o igual a 1");
    expect(validarCosto({ ...COSTO_VALIDO, cantidad_animales: "2.5" }).cantidad_animales).toBe("Debe ser un número entero");
  });

  it("rechaza un proposito que no existe", () => {
    expect(validarCosto({ ...COSTO_VALIDO, proposito: "Lana" }).proposito).toBe("Seleccione un propósito");
  });
});
