import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorSesion } from "../contexto/ProveedorSesion.jsx";
import { useConexion } from "../hooks/useConexion.js";
import { useFormulario } from "../hooks/useFormulario.js";
import { useLotes } from "../hooks/useLotes.js";
import { useSesion } from "../hooks/useSesion.js";
import { CLAVES, guardar, leer } from "../servicios/almacenLocal.js";
import { LOTES, SESION_PROPIETARIO, USUARIO_PROPIETARIO, simularApi } from "./datos.js";

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

const conSesion = ({ children }) => <ProveedorSesion>{children}</ProveedorSesion>;

describe("useSesion", () => {
  it("falla con un mensaje claro si falta el proveedor", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useSesion())).toThrow("useSesion debe usarse dentro de ProveedorSesion");
  });

  it("iniciarSesion guarda la sesion y cerrarSesion la borra junto con la copia de lotes", async () => {
    simularApi({ "POST /api/auth/login": { cuerpo: { token: "abc", usuario: USUARIO_PROPIETARIO } } });
    const { result } = renderHook(() => useSesion(), { wrapper: conSesion });
    expect(result.current.usuario).toBeNull();

    await act(() => result.current.iniciarSesion("carlos.ramirez@pastoreando.co", "Pastoreando2026*"));
    expect(result.current.usuario.nombre).toBe("Carlos");
    expect(leer(CLAVES.SESION).token).toBe("abc");

    guardar(CLAVES.LOTES, { idUsuario: 1, lotes: LOTES });
    act(() => result.current.cerrarSesion());
    expect(result.current.usuario).toBeNull();
    expect(leer(CLAVES.SESION)).toBeNull();
    expect(leer(CLAVES.LOTES)).toBeNull();
  });

  it("restaura la sesion guardada al recargar", () => {
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    const { result } = renderHook(() => useSesion(), { wrapper: conSesion });
    expect(result.current.usuario.rol).toBe("Propietario");
  });
});

describe("useConexion", () => {
  it("sigue los eventos online y offline y limpia los escuchadores", () => {
    const quitar = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(() => useConexion());
    expect(result.current).toBe(true);

    act(() => window.dispatchEvent(new Event("offline")));
    expect(result.current).toBe(false);
    act(() => window.dispatchEvent(new Event("online")));
    expect(result.current).toBe(true);

    unmount();
    const eventos = quitar.mock.calls.map(([nombre]) => nombre);
    expect(eventos).toEqual(expect.arrayContaining(["online", "offline"]));
  });
});

describe("useFormulario", () => {
  it("actualiza el valor por el atributo name y borra el error de ese campo", () => {
    const { result } = renderHook(() => useFormulario({ nombre: "", correo: "" }));
    act(() => result.current.establecerErrores({ nombre: "Obligatorio", correo: "Invalido" }));

    act(() => result.current.alCambiar({ target: { name: "nombre", value: "Ana" } }));
    expect(result.current.valores).toEqual({ nombre: "Ana", correo: "" });
    expect(result.current.errores).toEqual({ correo: "Invalido" });
  });
});

describe("useLotes", () => {
  const conSesionGuardada = () => guardar(CLAVES.SESION, SESION_PROPIETARIO);

  it("consulta los lotes y guarda una copia local", async () => {
    conSesionGuardada();
    simularApi({ "GET /api/lotes": { cuerpo: LOTES } });
    const { result } = renderHook(() => useLotes(), { wrapper: conSesion });
    expect(result.current.cargando).toBe(true);

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.lotes).toHaveLength(3);
    expect(result.current.desdeCache).toBe(false);
    expect(leer(CLAVES.LOTES).lotes).toHaveLength(3);
  });

  it("sin red entrega la copia local del mismo usuario", async () => {
    conSesionGuardada();
    guardar(CLAVES.LOTES, { idUsuario: 1, lotes: LOTES });
    simularApi({ RED_CAIDA: true });
    const { result } = renderHook(() => useLotes(), { wrapper: conSesion });

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.desdeCache).toBe(true);
    expect(result.current.lotes).toHaveLength(3);
    expect(result.current.sinConexion).toBe(false);
  });

  it("sin red y sin copia propia informa sinConexion", async () => {
    conSesionGuardada();
    guardar(CLAVES.LOTES, { idUsuario: 99, lotes: LOTES }); // copia de otro usuario: no sirve
    simularApi({ RED_CAIDA: true });
    const { result } = renderHook(() => useLotes(), { wrapper: conSesion });

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.sinConexion).toBe(true);
    expect(result.current.lotes).toEqual([]);
  });

  it("un error de la API no usa la copia local", async () => {
    conSesionGuardada();
    guardar(CLAVES.LOTES, { idUsuario: 1, lotes: LOTES });
    simularApi({ "GET /api/lotes": { estado: 500, cuerpo: { detalle: "Falla interna", campo: null } } });
    const { result } = renderHook(() => useLotes(), { wrapper: conSesion });

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error.detalle).toBe("Falla interna");
    expect(result.current.desdeCache).toBe(false);
  });

  it("vuelve a consultar cuando regresa la conexion", async () => {
    conSesionGuardada();
    const api = simularApi({ "GET /api/lotes": { cuerpo: LOTES } });
    const { result } = renderHook(() => useLotes(), { wrapper: conSesion });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    const consultasIniciales = api.mock.calls.length;

    act(() => window.dispatchEvent(new Event("offline")));
    act(() => window.dispatchEvent(new Event("online")));
    await waitFor(() => expect(api.mock.calls.length).toBeGreaterThan(consultasIniciales));
  });
});
