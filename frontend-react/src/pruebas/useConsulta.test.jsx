import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorSesion } from "../contexto/ProveedorSesion.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import { CLAVES, guardar, leer } from "../servicios/almacenLocal.js";
import { ErrorApi, ErrorRed } from "../servicios/clienteApi.js";
import { CONTRATOS, SESION_PROPIETARIO } from "./datos.js";

beforeEach(() => {
  window.localStorage.clear();
  guardar(CLAVES.SESION, SESION_PROPIETARIO);
});
afterEach(() => vi.unstubAllGlobals());

const conSesion = ({ children }) => <ProveedorSesion>{children}</ProveedorSesion>;

describe("useConsulta", () => {
  it("entrega los datos y termina de cargar", async () => {
    const consultar = vi.fn().mockResolvedValue(CONTRATOS);
    const { result } = renderHook(() => useConsulta(consultar), { wrapper: conSesion });
    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.datos).toEqual(CONTRATOS);
    expect(result.current.error).toBeNull();
    expect(leer(CLAVES.CONTRATOS)).toBeNull();
  });

  it("con clave guarda la copia del usuario", async () => {
    const consultar = vi.fn().mockResolvedValue(CONTRATOS);
    const { result } = renderHook(() => useConsulta(consultar, { clave: CLAVES.CONTRATOS }), { wrapper: conSesion });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(leer(CLAVES.CONTRATOS)).toEqual({ idUsuario: 1, datos: CONTRATOS });
  });

  it("sin red usa la copia guardada del mismo usuario", async () => {
    guardar(CLAVES.CONTRATOS, { idUsuario: 1, datos: CONTRATOS });
    const consultar = vi.fn().mockRejectedValue(new ErrorRed());
    const { result } = renderHook(() => useConsulta(consultar, { clave: CLAVES.CONTRATOS }), { wrapper: conSesion });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.datos).toEqual(CONTRATOS);
    expect(result.current.desdeCache).toBe(true);
    expect(result.current.sinConexion).toBe(false);
  });

  it("sin red y sin copia, o con la copia de otro usuario, reporta sinConexion", async () => {
    guardar(CLAVES.CONTRATOS, { idUsuario: 99, datos: CONTRATOS });
    const consultar = vi.fn().mockRejectedValue(new ErrorRed());
    const { result } = renderHook(() => useConsulta(consultar, { clave: CLAVES.CONTRATOS }), { wrapper: conSesion });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.datos).toBeNull();
    expect(result.current.sinConexion).toBe(true);
  });

  it("un error de la API no usa la copia y se entrega tal cual", async () => {
    guardar(CLAVES.CONTRATOS, { idUsuario: 1, datos: CONTRATOS });
    const consultar = vi.fn().mockRejectedValue(new ErrorApi(403, "No permitido"));
    const { result } = renderHook(() => useConsulta(consultar, { clave: CLAVES.CONTRATOS }), { wrapper: conSesion });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error.detalle).toBe("No permitido");
    expect(result.current.datos).toBeNull();
  });

  it("recargar vuelve a consultar y las dependencias tambien", async () => {
    const consultar = vi.fn().mockResolvedValue(CONTRATOS);
    const { result, rerender } = renderHook(({ id }) => useConsulta(consultar, { dependencias: [id] }), {
      wrapper: conSesion,
      initialProps: { id: 1 },
    });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(consultar).toHaveBeenCalledTimes(1);

    act(() => result.current.recargar());
    await waitFor(() => expect(consultar).toHaveBeenCalledTimes(2));

    rerender({ id: 2 });
    await waitFor(() => expect(consultar).toHaveBeenCalledTimes(3));
  });
});
