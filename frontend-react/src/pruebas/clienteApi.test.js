import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLAVES, guardar, leer } from "../servicios/almacenLocal.js";
import { ErrorApi, ErrorRed, EVENTO_SESION_EXPIRADA, solicitar, solicitarArchivo } from "../servicios/clienteApi.js";
import { SESION_PROPIETARIO, simularApi } from "./datos.js";

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("solicitar", () => {
  it("devuelve el JSON de una respuesta correcta", async () => {
    simularApi({ "GET /api/prueba": { cuerpo: { dato: 1 } } });
    await expect(solicitar("/api/prueba")).resolves.toEqual({ dato: 1 });
  });

  it("envia el token guardado en la cabecera Authorization", async () => {
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    const fetchSimulado = simularApi({ "GET /api/prueba": {} });
    await solicitar("/api/prueba");
    expect(fetchSimulado.mock.calls[0][1].headers.Authorization).toBe("Bearer token-de-prueba");
  });

  it("serializa el cuerpo como JSON", async () => {
    const fetchSimulado = simularApi({ "POST /api/prueba": {} });
    await solicitar("/api/prueba", { metodo: "POST", cuerpo: { a: 1 } });
    const opciones = fetchSimulado.mock.calls[0][1];
    expect(opciones.headers["Content-Type"]).toBe("application/json");
    expect(opciones.body).toBe('{"a":1}');
  });

  it("traduce el error {detalle, campo} de la API a ErrorApi", async () => {
    simularApi({ "POST /api/prueba": { estado: 422, cuerpo: { detalle: "Es obligatorio", campo: "nombre" } } });
    const error = await solicitar("/api/prueba", { metodo: "POST", cuerpo: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ estado: 422, detalle: "Es obligatorio", campo: "nombre" });
  });

  it("usa un mensaje general si el error no trae JSON", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 500, json: async () => { throw new Error("html"); } }));
    const error = await solicitar("/api/prueba").catch((e) => e);
    expect(error.estado).toBe(500);
    expect(error.detalle).toMatch(/inesperado/);
  });

  it("lanza ErrorRed cuando fetch falla", async () => {
    simularApi({ RED_CAIDA: true });
    await expect(solicitar("/api/prueba")).rejects.toBeInstanceOf(ErrorRed);
  });

  it("un 401 con sesion borra el token y avisa con un evento", async () => {
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    simularApi({ "GET /api/prueba": { estado: 401, cuerpo: { detalle: "Token vencido", campo: null } } });
    const aviso = vi.fn();
    window.addEventListener(EVENTO_SESION_EXPIRADA, aviso);
    await solicitar("/api/prueba").catch(() => {});
    window.removeEventListener(EVENTO_SESION_EXPIRADA, aviso);
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(leer(CLAVES.SESION)).toBeNull();
  });

  it("un 401 sin sesion (credenciales malas) no dispara el evento", async () => {
    simularApi({ "POST /api/auth/login": { estado: 401, cuerpo: { detalle: "Correo o contraseña incorrectos", campo: null } } });
    const aviso = vi.fn();
    window.addEventListener(EVENTO_SESION_EXPIRADA, aviso);
    await solicitar("/api/auth/login", { metodo: "POST", cuerpo: {}, conSesion: false }).catch(() => {});
    window.removeEventListener(EVENTO_SESION_EXPIRADA, aviso);
    expect(aviso).not.toHaveBeenCalled();
  });
});

describe("solicitarArchivo", () => {
  it("devuelve el contenido y el nombre que propone la API, enviando el token", async () => {
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    const fetchSimulado = simularApi({
      "GET /api/archivo": { cuerpo: "contenido", cabeceras: { "Content-Disposition": 'attachment; filename="reporte.pdf"' } },
    });
    const { blob, nombre } = await solicitarArchivo("/api/archivo");
    expect(nombre).toBe("reporte.pdf");
    expect(await blob.text()).toBe("contenido");
    expect(fetchSimulado.mock.calls[0][1].headers.Authorization).toBe("Bearer token-de-prueba");
  });

  it("usa un nombre general si la API no propone ninguno", async () => {
    simularApi({ "GET /api/archivo": { cuerpo: "x" } });
    expect((await solicitarArchivo("/api/archivo")).nombre).toBe("reporte");
  });

  it("traduce el error de la API a ErrorApi y la falta de red a ErrorRed", async () => {
    simularApi({ "GET /api/archivo": { estado: 403, cuerpo: { detalle: "No tiene permiso", campo: null } } });
    await expect(solicitarArchivo("/api/archivo")).rejects.toMatchObject({ estado: 403, detalle: "No tiene permiso" });
    simularApi({ RED_CAIDA: true });
    await expect(solicitarArchivo("/api/archivo")).rejects.toBeInstanceOf(ErrorRed);
  });

  it("un 401 con sesion borra el token y avisa con un evento", async () => {
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    simularApi({ "GET /api/archivo": { estado: 401, cuerpo: { detalle: "Token vencido", campo: null } } });
    const aviso = vi.fn();
    window.addEventListener(EVENTO_SESION_EXPIRADA, aviso);
    await solicitarArchivo("/api/archivo").catch(() => {});
    window.removeEventListener(EVENTO_SESION_EXPIRADA, aviso);
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(leer(CLAVES.SESION)).toBeNull();
  });
});
