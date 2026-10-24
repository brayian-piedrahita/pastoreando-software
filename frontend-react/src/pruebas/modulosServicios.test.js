// Cada servicio arma la solicitud que espera la API: metodo, ruta y cuerpo con los tipos correctos.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLAVES, guardar } from "../servicios/almacenLocal.js";
import {
  crearGanado, eliminarGanado, listarContratos, listarGanado, obtenerContrato, obtenerDocumento,
} from "../servicios/servicioContratos.js";
import { consultarFirmas, firmarContrato } from "../servicios/servicioFirmas.js";
import { listarPagos, registrarPago, resolverPago } from "../servicios/servicioPagos.js";
import {
  crearRecomendacion, eliminarRecomendacion, listarRecomendaciones,
} from "../servicios/servicioRecomendaciones.js";
import { descargarReporte, obtenerRentabilidad } from "../servicios/servicioReportes.js";
import { CONTRATOS, DOCUMENTO, PAGOS, REPORTE, SESION_PROPIETARIO, simularApi } from "./datos.js";

beforeEach(() => {
  window.localStorage.clear();
  guardar(CLAVES.SESION, SESION_PROPIETARIO);
});
afterEach(() => vi.unstubAllGlobals());

const ultimaLlamada = (api) => {
  const [url, opciones] = api.mock.calls.at(-1);
  return { url, metodo: opciones.method, cuerpo: opciones.body ? JSON.parse(opciones.body) : undefined, opciones };
};

describe("servicioContratos", () => {
  it("lee contratos, un contrato, su documento y su ganado con la sesion", async () => {
    const api = simularApi({
      "GET /api/contratos": { cuerpo: CONTRATOS },
      "GET /api/contratos/1": { cuerpo: CONTRATOS[0] },
      "GET /api/contratos/1/documento": { cuerpo: DOCUMENTO },
      "GET /api/contratos/1/ganado": { cuerpo: [] },
    });
    expect(await listarContratos()).toHaveLength(2);
    expect((await obtenerContrato(1)).nombre_lote).toBe("Potrero La Esperanza");
    expect((await obtenerDocumento(1)).huella_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(await listarGanado(1)).toEqual([]);
    expect(ultimaLlamada(api).opciones.headers.Authorization).toBe("Bearer token-de-prueba");
  });

  it("crearGanado envia la cantidad como numero y la raza sin espacios sobrantes", async () => {
    const api = simularApi({ "POST /api/contratos/1/ganado": { estado: 201, cuerpo: { id_ganado: 9 } } });
    await crearGanado(1, { raza: "  Angus ", cantidad_cabezas: "4", proposito: "Carne" });
    expect(ultimaLlamada(api).cuerpo).toEqual({ raza: "Angus", cantidad_cabezas: 4, proposito: "Carne" });
  });

  it("eliminarGanado usa DELETE y acepta la respuesta vacia (204)", async () => {
    const api = simularApi({ "DELETE /api/ganado/3": { estado: 204, cuerpo: null } });
    expect(await eliminarGanado(3)).toBeNull();
    expect(ultimaLlamada(api).metodo).toBe("DELETE");
  });
});

describe("servicioPagos", () => {
  it("lista, registra con monto numerico y resuelve con PUT", async () => {
    const api = simularApi({
      "GET /api/contratos/1/pagos": { cuerpo: PAGOS },
      "POST /api/contratos/1/pagos": { estado: 201, cuerpo: PAGOS[1] },
      "PUT /api/pagos/2/estado": { cuerpo: { ...PAGOS[1], estado_pago: "Confirmado" } },
    });
    expect(await listarPagos(1)).toHaveLength(2);

    await registrarPago(1, { fecha_pago: "2026-11-01", monto_total: "2210000", metodo_pago: "PSE" });
    expect(ultimaLlamada(api).cuerpo).toEqual({ fecha_pago: "2026-11-01", monto_total: 2210000, metodo_pago: "PSE" });

    await resolverPago(2, "Confirmado");
    expect(ultimaLlamada(api)).toMatchObject({ metodo: "PUT", cuerpo: { estado_pago: "Confirmado" } });
  });
});

describe("servicioFirmas, servicioRecomendaciones y servicioReportes", () => {
  it("consulta y firma el contrato", async () => {
    const api = simularApi({
      "GET /api/contratos/1/firmas": { cuerpo: { firmas: [] } },
      "POST /api/contratos/1/firma": { estado: 201, cuerpo: { firmas: [{ id_firma: 1 }] } },
    });
    await consultarFirmas(1);
    await firmarContrato(1);
    expect(ultimaLlamada(api)).toMatchObject({ url: "/api/contratos/1/firma", metodo: "POST" });
  });

  it("lista, crea (sin espacios sobrantes) y elimina recomendaciones", async () => {
    const api = simularApi({
      "GET /api/ganado/1/recomendaciones": { cuerpo: [] },
      "POST /api/ganado/1/recomendaciones": { estado: 201, cuerpo: { id_recomendacion: 4 } },
      "DELETE /api/recomendaciones/4": { estado: 204, cuerpo: null },
    });
    await listarRecomendaciones(1);
    await crearRecomendacion(1, "  Rotar el hato cada quince dias.  ");
    expect(ultimaLlamada(api).cuerpo).toEqual({ descripcion: "Rotar el hato cada quince dias." });
    await eliminarRecomendacion(4);
    expect(ultimaLlamada(api).metodo).toBe("DELETE");
  });

  it("pide el reporte de rentabilidad", async () => {
    simularApi({ "GET /api/reportes/rentabilidad": { cuerpo: REPORTE } });
    expect((await obtenerRentabilidad()).totales.ingreso_total).toBe(21900000);
  });

  it("descarga el reporte en PDF y en Excel con la ruta de cada formato", async () => {
    const api = simularApi({
      "GET /api/reportes/rentabilidad/pdf": {
        cuerpo: "%PDF", cabeceras: { "Content-Disposition": 'attachment; filename="reporte.pdf"' },
      },
      "GET /api/reportes/rentabilidad/excel": {
        cuerpo: "xlsx", cabeceras: { "Content-Disposition": 'attachment; filename="reporte.xlsx"' },
      },
    });
    expect((await descargarReporte("pdf")).nombre).toBe("reporte.pdf");
    expect(ultimaLlamada(api).url).toBe("/api/reportes/rentabilidad/pdf");
    expect((await descargarReporte("excel")).nombre).toBe("reporte.xlsx");
    expect(ultimaLlamada(api).url).toBe("/api/reportes/rentabilidad/excel");
  });
});
