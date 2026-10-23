import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calcularCosto, listarEstrategias } from "../servicios/servicioCostos.js";
import { iniciarSesion, registrarUsuario } from "../servicios/servicioAuth.js";
import { listarLotes } from "../servicios/servicioLotes.js";
import { CALCULO_CARNE, ESTRATEGIAS, LOTES, USUARIO_PROPIETARIO, simularApi } from "./datos.js";

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("servicioAuth", () => {
  it("iniciarSesion devuelve token y usuario", async () => {
    const api = simularApi({ "POST /api/auth/login": { cuerpo: { token: "abc", usuario: USUARIO_PROPIETARIO } } });
    const sesion = await iniciarSesion("  carlos.ramirez@pastoreando.co ", "Pastoreando2026*");
    expect(sesion).toEqual({ token: "abc", usuario: USUARIO_PROPIETARIO });
    expect(JSON.parse(api.mock.calls[0][1].body).correo).toBe("carlos.ramirez@pastoreando.co");
  });

  it("registrarUsuario envia el codigo nulo cuando no aplica", async () => {
    const api = simularApi({ "POST /api/auth/registro": { estado: 201, cuerpo: { usuario: USUARIO_PROPIETARIO } } });
    await registrarUsuario({
      nombre: "Ana ", apellidos: "Londoño", cedula: "1112223334", rol: "Arrendatario",
      correo: "ana@pastoreando.co", contrasena: "Clave2026", codigo_profesional: "",
    });
    const cuerpo = JSON.parse(api.mock.calls[0][1].body);
    expect(cuerpo.codigo_profesional).toBeNull();
    expect(cuerpo.nombre).toBe("Ana");
  });
});

describe("servicioLotes y servicioCostos", () => {
  it("listarLotes consulta GET /api/lotes", async () => {
    simularApi({ "GET /api/lotes": { cuerpo: LOTES } });
    await expect(listarLotes()).resolves.toHaveLength(3);
  });

  it("calcularCosto convierte los textos del formulario en numeros", async () => {
    const api = simularApi({ "POST /api/costos/calcular": { cuerpo: CALCULO_CARNE } });
    const resultado = await calcularCosto({
      alimentacion: "6000000", mantenimiento: "3000000", servicios: "1500000", impuestos: "1500000",
      cantidad_animales: "50", proposito: "Carne",
    });
    expect(JSON.parse(api.mock.calls[0][1].body)).toEqual({
      alimentacion: 6000000, mantenimiento: 3000000, servicios: 1500000, impuestos: 1500000,
      cantidad_animales: 50, proposito: "Carne",
    });
    expect(resultado.costo_unitario_final).toBe(288000);
  });

  it("listarEstrategias devuelve los propositos", async () => {
    simularApi({ "GET /api/costos/estrategias": { cuerpo: ESTRATEGIAS } });
    const estrategias = await listarEstrategias();
    expect(estrategias.map((e) => e.proposito)).toEqual(["Carne", "Leche", "Doble Proposito"]);
  });
});
