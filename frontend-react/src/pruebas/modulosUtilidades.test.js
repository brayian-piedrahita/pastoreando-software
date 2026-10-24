// Validaciones, permisos y formatos de los modulos de contratos, ganado, pagos y recomendaciones.

import { describe, expect, it, vi } from "vitest";
import { guardarArchivo } from "../utilidades/descargas.js";
import { formatoFecha, formatoFechaHora } from "../utilidades/formato.js";
import {
  puedeFirmar, puedeRecomendar, puedeRegistrarGanado, puedeRegistrarPago, puedeResolverPagos, puedeVerReportes,
} from "../utilidades/permisos.js";
import { validarGanado, validarPago, validarRecomendacion } from "../utilidades/validaciones.js";

describe("validarGanado", () => {
  it("acepta un hato correcto", () => {
    expect(validarGanado({ raza: "Brahman", cantidad_cabezas: "8", proposito: "Carne" })).toEqual({});
  });

  it("acepta razas con tilde, espacio o guion", () => {
    expect(validarGanado({ raza: "Cebú Criollo", cantidad_cabezas: "2", proposito: "Leche" })).toEqual({});
  });

  it("reporta cada campo vacio o invalido", () => {
    const errores = validarGanado({ raza: "", cantidad_cabezas: "", proposito: "Otro" });
    expect(errores).toEqual({
      raza: "La raza es obligatoria",
      cantidad_cabezas: "La cantidad de cabezas es obligatoria",
      proposito: "Seleccione un propósito",
    });
  });

  it("rechaza razas con numeros, cortas o largas y cantidades no enteras o menores a 1", () => {
    expect(validarGanado({ raza: "Gyr 2", cantidad_cabezas: "1", proposito: "Carne" }).raza).toBe("La raza solo admite letras");
    expect(validarGanado({ raza: "A", cantidad_cabezas: "1", proposito: "Carne" }).raza).toMatch(/al menos 2/);
    expect(validarGanado({ raza: "A".repeat(41), cantidad_cabezas: "1", proposito: "Carne" }).raza).toMatch(/40/);
    expect(validarGanado({ raza: "Gyr", cantidad_cabezas: "2,5", proposito: "Carne" }).cantidad_cabezas).toBe("Debe ser un número entero");
    expect(validarGanado({ raza: "Gyr", cantidad_cabezas: "0", proposito: "Carne" }).cantidad_cabezas).toBe("Debe ser mayor o igual a 1");
  });
});

describe("validarPago", () => {
  it("acepta un pago correcto", () => {
    expect(validarPago({ fecha_pago: "2026-11-01", monto_total: "2210000", metodo_pago: "PSE" })).toEqual({});
  });

  it("exige fecha, monto positivo y un metodo de la lista", () => {
    expect(validarPago({ fecha_pago: "", monto_total: "", metodo_pago: "" })).toEqual({
      fecha_pago: "La fecha del pago es obligatoria",
      monto_total: "El monto es obligatorio",
      metodo_pago: "Seleccione un método de pago",
    });
    expect(validarPago({ fecha_pago: "01/11/2026", monto_total: "0", metodo_pago: "Cheque" })).toEqual({
      fecha_pago: "Escriba una fecha válida",
      monto_total: "Debe ser mayor a 0",
      metodo_pago: "Seleccione un método de pago",
    });
    expect(validarPago({ fecha_pago: "2026-11-01", monto_total: "abc", metodo_pago: "PSE" }).monto_total).toBe("Debe ser un número");
  });
});

describe("validarRecomendacion", () => {
  it("pide entre 10 y 500 caracteres", () => {
    expect(validarRecomendacion({ descripcion: "" }).descripcion).toBe("La recomendación es obligatoria");
    expect(validarRecomendacion({ descripcion: "Corta" }).descripcion).toBe("Debe tener al menos 10 caracteres");
    expect(validarRecomendacion({ descripcion: "x".repeat(501) }).descripcion).toBe("No puede superar 500 caracteres");
    expect(validarRecomendacion({ descripcion: "Rotar el hato cada 15 dias." })).toEqual({});
  });
});

describe("permisos por rol", () => {
  it("refleja lo que la API autoriza", () => {
    expect(puedeVerReportes("Propietario")).toBe(true);
    expect(puedeVerReportes("Contador")).toBe(true);
    expect(puedeVerReportes("Arrendatario")).toBe(false);
    expect(puedeVerReportes("Tecnico")).toBe(false);

    expect(puedeFirmar("Propietario")).toBe(true);
    expect(puedeFirmar("Arrendatario")).toBe(true);
    expect(puedeFirmar("Contador")).toBe(false);

    expect(puedeRegistrarGanado("Arrendatario")).toBe(true);
    expect(puedeRegistrarGanado("Propietario")).toBe(false);
    expect(puedeRegistrarPago("Arrendatario")).toBe(true);
    expect(puedeRegistrarPago("Contador")).toBe(false);
    expect(puedeResolverPagos("Propietario")).toBe(true);
    expect(puedeResolverPagos("Contador")).toBe(true);
    expect(puedeResolverPagos("Arrendatario")).toBe(false);
    expect(puedeRecomendar("Tecnico")).toBe(true);
    expect(puedeRecomendar("Propietario")).toBe(false);
  });
});

describe("formatoFecha", () => {
  it("escribe la fecha en espanol sin correr el dia por la zona horaria", () => {
    expect(formatoFecha("2026-10-01")).toBe("1 de octubre de 2026");
    expect(formatoFecha("2027-04-01")).toBe("1 de abril de 2027");
  });

  it("devuelve raya cuando el valor no es una fecha", () => {
    expect(formatoFecha(null)).toBe("—");
    expect(formatoFecha("ayer")).toBe("—");
  });

  it("formatoFechaHora incluye la hora y cae a fecha simple si no hay T", () => {
    expect(formatoFechaHora("2026-10-24T09:15:00")).toMatch(/24 de octubre de 2026/);
    expect(formatoFechaHora("2026-10-24")).toBe("24 de octubre de 2026");
    expect(formatoFechaHora("2026-99-99T99:99:99")).toBe("—");
  });
});

describe("guardarArchivo", () => {
  it("crea un enlace temporal con el nombre indicado, lo pulsa y lo libera", () => {
    URL.createObjectURL = vi.fn(() => "blob:prueba");
    URL.revokeObjectURL = vi.fn();
    const pulsar = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const blob = new Blob(["x"]);
    guardarArchivo(blob, "reporte.pdf");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(pulsar).toHaveBeenCalledTimes(1);
    expect(pulsar.mock.contexts[0].download).toBe("reporte.pdf");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:prueba");
    expect(document.querySelector("a[download]")).toBeNull();
    pulsar.mockRestore();
  });
});
