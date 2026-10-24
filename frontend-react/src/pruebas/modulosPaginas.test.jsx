// Recorrido de los modulos de contratos, ganado, firma, pagos, recomendaciones y reportes con la
// API simulada, para cada rol que interviene.

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";
import { CLAVES, guardar, leer } from "../servicios/almacenLocal.js";
import {
  CONTRATOS, FIRMA_PROPIETARIO, PAGOS, RECOMENDACIONES, SIN_FIRMAS, USUARIO_ARRENDATARIO, USUARIO_CONTADOR,
  USUARIO_PROPIETARIO, USUARIO_TECNICO, rutasContrato1, sesionDe, simularApi,
} from "./datos.js";

function dibujarApp(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  );
}

const entrarComo = (usuario) => guardar(CLAVES.SESION, sesionDe(usuario));
const llamadas = (api, metodo, url) =>
  api.mock.calls.filter(([ruta, opciones]) => ruta === url && (opciones?.method ?? "GET") === metodo);

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("menu y rutas por rol", () => {
  it.each([
    [USUARIO_PROPIETARIO, true],
    [USUARIO_CONTADOR, true],
    [USUARIO_ARRENDATARIO, false],
    [USUARIO_TECNICO, false],
  ])("el menu de %s muestra contratos y %s los reportes", async (usuario, verReportes) => {
    entrarComo(usuario);
    simularApi(rutasContrato1());
    dibujarApp("/panel");
    const menu = await screen.findByRole("navigation", { name: "Principal" });
    expect(within(menu).getByText("Contratos y firma (RF05)")).toBeInTheDocument();
    expect(Boolean(within(menu).queryByText("Reportes (RF06)"))).toBe(verReportes);
  });

  it("un arrendatario que abre /reportes vuelve al panel", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1());
    dibujarApp("/reportes");
    expect(await screen.findByRole("heading", { name: "Panel de control" })).toBeInTheDocument();
  });
});

describe("lista de contratos", () => {
  it("muestra una tarjeta por contrato con sus valores y estado", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1());
    dibujarApp("/contratos");
    expect(await screen.findByRole("heading", { name: "Contrato 0001 · Potrero La Esperanza" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contrato 0004 · Lote Rio Frio" })).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Finalizado")).toBeInTheDocument();
    expect(screen.getByText("$ 13.260.000,00")).toBeInTheDocument();
    expect(leer(CLAVES.CONTRATOS).datos).toHaveLength(2);
  });

  it("VER DETALLE abre el contrato elegido", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1());
    dibujarApp("/contratos");
    const enlaces = await screen.findAllByRole("link", { name: "VER DETALLE" });
    await userEvent.click(enlaces[0]);
    expect(await screen.findByRole("heading", { name: "Contrato 0001 · Potrero La Esperanza", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Tarifa por cabeza")).toBeInTheDocument();
  });

  it("sin red muestra la copia guardada y lo avisa", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    guardar(CLAVES.CONTRATOS, { idUsuario: 2, datos: CONTRATOS });
    simularApi({ RED_CAIDA: true });
    dibujarApp("/contratos");
    expect(await screen.findByText(/Datos guardados en este dispositivo/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contrato 0001 · Potrero La Esperanza" })).toBeInTheDocument();
  });

  it("sin red y sin copia lleva a la pantalla de sin conexion", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi({ RED_CAIDA: true });
    dibujarApp("/contratos");
    expect(await screen.findByRole("heading", { name: "¡Ha ocurrido un inconveniente!" })).toBeInTheDocument();
  });

  it("al cerrar sesion se borran las copias de contratos y reportes", async () => {
    entrarComo(USUARIO_PROPIETARIO);
    guardar(CLAVES.CONTRATOS, { idUsuario: 1, datos: CONTRATOS });
    guardar(CLAVES.REPORTE, { idUsuario: 1, datos: {} });
    simularApi(rutasContrato1());
    dibujarApp("/panel");
    await userEvent.click(await screen.findByRole("button", { name: "Cerrar sesión" }));
    expect(leer(CLAVES.CONTRATOS)).toBeNull();
    expect(leer(CLAVES.REPORTE)).toBeNull();
  });
});

describe("detalle del contrato", () => {
  it("un contrato inexistente muestra el mensaje de la API y un enlace de regreso", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1({ "GET /api/contratos/99": { estado: 404, cuerpo: { detalle: "No existe el contrato 99", campo: null } } }));
    dibujarApp("/contratos/99");
    expect(await screen.findByRole("alert")).toHaveTextContent("No existe el contrato 99");
    expect(screen.getByRole("link", { name: "Volver a los contratos" })).toBeInTheDocument();
  });

  it("en un contrato finalizado no se ofrece registrar ganado ni pagos", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1({
      "GET /api/contratos/4": { cuerpo: CONTRATOS[1] },
      "GET /api/contratos/4/ganado": { cuerpo: [] },
      "GET /api/contratos/4/documento": { cuerpo: { texto: "CONTRATO", huella_sha256: "a".repeat(64) } },
      "GET /api/contratos/4/firmas": { cuerpo: { ...SIN_FIRMAS, id_contrato: 4 } },
      "GET /api/contratos/4/pagos": { cuerpo: [] },
    }));
    dibujarApp("/contratos/4");
    expect(await screen.findByText("Solo se registra ganado en contratos activos.")).toBeInTheDocument();
    expect(screen.getByText("Solo se registran pagos en contratos activos.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "REGISTRAR GANADO" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "FIRMAR CONTRATO" })).not.toBeInTheDocument();
  });
});

describe("ganado del contrato", () => {
  it("el arrendatario ve los hatos, valida el formulario y registra uno nuevo con la alerta de carga", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    let guardado = false;
    const api = simularApi(rutasContrato1({
      "GET /api/contratos/1/ganado": () => ({
        cuerpo: guardado ? [...rutasContrato1()["GET /api/contratos/1/ganado"].cuerpo, { id_ganado: 9, id_contrato: 1, raza: "Angus", cantidad_cabezas: 4, proposito: "Carne" }] : rutasContrato1()["GET /api/contratos/1/ganado"].cuerpo,
      }),
      "POST /api/contratos/1/ganado": () => {
        guardado = true;
        return {
          estado: 201,
          cuerpo: {
            id_ganado: 9, id_contrato: 1, raza: "Angus", cantidad_cabezas: 4, proposito: "Carne",
            estado_carga: { carga_actual: 31, capacidad_carga: 30, porcentaje: 103.3, nivel: "SOBRECARGA", mensaje: "¡Sobrecarga! El lote supera su capacidad en 1 cabeza(s).", excedente: 1, sugerencias: [] },
          },
        };
      },
    }));
    dibujarApp("/contratos/1");
    expect(await screen.findByText("Brahman")).toBeInTheDocument();
    expect(screen.getAllByText("Doble Propósito").length).toBeGreaterThan(0);

    // Con el formulario vacio no se llama a la API.
    await userEvent.click(screen.getByRole("button", { name: "REGISTRAR GANADO" }));
    expect(screen.getByText("La raza es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("La cantidad de cabezas es obligatoria")).toBeInTheDocument();
    expect(llamadas(api, "POST", "/api/contratos/1/ganado")).toHaveLength(0);

    await userEvent.type(screen.getByLabelText("Raza"), "Angus");
    await userEvent.type(screen.getByLabelText("Cantidad de cabezas"), "4");
    await userEvent.click(screen.getByRole("button", { name: "REGISTRAR GANADO" }));

    expect(await screen.findByText(/¡Sobrecarga! El lote supera su capacidad en 1 cabeza/)).toBeInTheDocument();
    expect(JSON.parse(llamadas(api, "POST", "/api/contratos/1/ganado")[0][1].body)).toEqual({
      raza: "Angus", cantidad_cabezas: 4, proposito: "Carne",
    });
    expect(await screen.findByText("Angus")).toBeInTheDocument();
    expect(screen.getByLabelText("Raza")).toHaveValue("");
  });

  it("muestra el error de la API cuando rechaza el hato", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1({
      "POST /api/contratos/1/ganado": { estado: 409, cuerpo: { detalle: "Solo se registra ganado en contratos activos", campo: null } },
    }));
    dibujarApp("/contratos/1");
    await screen.findByText("Brahman");
    await userEvent.type(screen.getByLabelText("Raza"), "Angus");
    await userEvent.type(screen.getByLabelText("Cantidad de cabezas"), "4");
    await userEvent.click(screen.getByRole("button", { name: "REGISTRAR GANADO" }));
    expect(await screen.findByText("Solo se registra ganado en contratos activos")).toBeInTheDocument();
    expect(screen.getByLabelText("Raza")).toHaveValue("Angus");
  });

  it("elimina un hato solo despues de confirmar", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    const api = simularApi(rutasContrato1({ "DELETE /api/ganado/1": { estado: 204, cuerpo: null } }));
    dibujarApp("/contratos/1");
    await userEvent.click(await screen.findByRole("button", { name: "Eliminar el hato Brahman" }));
    expect(llamadas(api, "DELETE", "/api/ganado/1")).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "CANCELAR" }));
    expect(screen.queryByRole("button", { name: "SÍ, ELIMINAR" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Eliminar el hato Brahman" }));
    await userEvent.click(screen.getByRole("button", { name: "SÍ, ELIMINAR" }));
    await waitFor(() => expect(llamadas(api, "DELETE", "/api/ganado/1")).toHaveLength(1));
  });

  it("el propietario ve el ganado pero no puede registrar ni eliminar", async () => {
    entrarComo(USUARIO_PROPIETARIO);
    simularApi(rutasContrato1());
    dibujarApp("/contratos/1");
    expect(await screen.findByText("Brahman")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "REGISTRAR GANADO" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar el hato Brahman" })).not.toBeInTheDocument();
  });
});

describe("recomendaciones", () => {
  it("el tecnico lee, agrega y elimina sus recomendaciones", async () => {
    entrarComo(USUARIO_TECNICO);
    let lista = RECOMENDACIONES;
    const api = simularApi(rutasContrato1({
      "GET /api/ganado/1/recomendaciones": () => ({ cuerpo: lista }),
      "POST /api/ganado/1/recomendaciones": (opciones) => {
        const nueva = { ...RECOMENDACIONES[0], id_recomendacion: 7, descripcion: JSON.parse(opciones.body).descripcion };
        lista = [...lista, nueva];
        return { estado: 201, cuerpo: nueva };
      },
      "DELETE /api/recomendaciones/7": () => {
        lista = RECOMENDACIONES;
        return { estado: 204, cuerpo: null };
      },
    }));
    dibujarApp("/contratos/1");
    await userEvent.click(await screen.findByRole("button", { name: "Recomendaciones del hato Brahman" }));
    expect(await screen.findByText("Rotar el hato cada 15 dias para recuperar el pasto.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "AGREGAR RECOMENDACIÓN" }));
    expect(screen.getByText("La recomendación es obligatoria")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Nueva recomendación técnica"), "Suplementar con sal mineralizada.");
    await userEvent.click(screen.getByRole("button", { name: "AGREGAR RECOMENDACIÓN" }));
    expect(await screen.findByText("Suplementar con sal mineralizada.")).toBeInTheDocument();
    expect(JSON.parse(llamadas(api, "POST", "/api/ganado/1/recomendaciones")[0][1].body)).toEqual({
      descripcion: "Suplementar con sal mineralizada.",
    });

    await userEvent.click(screen.getByRole("button", { name: "Eliminar la recomendación 7" }));
    await waitFor(() => expect(screen.queryByText("Suplementar con sal mineralizada.")).not.toBeInTheDocument());
  });

  it("el propietario las lee pero no tiene formulario ni boton de borrar", async () => {
    entrarComo(USUARIO_PROPIETARIO);
    simularApi(rutasContrato1());
    dibujarApp("/contratos/1");
    await userEvent.click(await screen.findByRole("button", { name: "Recomendaciones del hato Brahman" }));
    expect(await screen.findByText("Rotar el hato cada 15 dias para recuperar el pasto.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "AGREGAR RECOMENDACIÓN" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Eliminar la recomendación/ })).not.toBeInTheDocument();
  });

  it("un hato sin recomendaciones lo indica", async () => {
    entrarComo(USUARIO_PROPIETARIO);
    simularApi(rutasContrato1());
    dibujarApp("/contratos/1");
    await userEvent.click(await screen.findByRole("button", { name: "Recomendaciones del hato Girolando" }));
    expect(await screen.findByText("Este hato todavía no tiene recomendaciones.")).toBeInTheDocument();
  });
});

describe("documento y firma", () => {
  it("muestra el texto con su huella y el arrendatario firma hasta completar ambas partes", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    let firmas = { ...SIN_FIRMAS, firmas: [FIRMA_PROPIETARIO] };
    const api = simularApi(rutasContrato1({
      "GET /api/contratos/1/firmas": () => ({ cuerpo: firmas }),
      "POST /api/contratos/1/firma": () => {
        firmas = {
          ...SIN_FIRMAS,
          firmado_por_ambas_partes: true,
          firmas: [FIRMA_PROPIETARIO, { ...FIRMA_PROPIETARIO, id_firma: 2, id_usuario: 2, nombre_firmante: "Brayian Piedrahita Cortes", rol_firmante: "Arrendatario" }],
        };
        return { estado: 201, cuerpo: firmas };
      },
    }));
    dibujarApp("/contratos/1");
    expect(await screen.findByLabelText("Texto del contrato")).toHaveTextContent("CONTRATO DE ARRENDAMIENTO GANADERO No. 0001");
    expect(screen.getByText(/7b523682c1bf004bef52befca1699b50aedcada06737f23301902ef27c90f92c/)).toBeInTheDocument();
    // El nombre sale en el resumen del contrato y en la lista de firmas.
    expect(await screen.findByText("Vigente")).toBeInTheDocument();
    expect(screen.getAllByText("Carlos Ramirez Soto")).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "FIRMAR CONTRATO" }));
    expect(await screen.findByText("El contrato está firmado por ambas partes.")).toBeInTheDocument();
    expect(llamadas(api, "POST", "/api/contratos/1/firma")).toHaveLength(1);
    expect(screen.getByText("Usted ya firmó la versión vigente.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "FIRMAR CONTRATO" })).not.toBeInTheDocument();
  });

  it("una firma anterior al ultimo cambio del ganado se marca como desactualizada", async () => {
    entrarComo(USUARIO_PROPIETARIO);
    simularApi(rutasContrato1({
      "GET /api/contratos/1/firmas": { cuerpo: { ...SIN_FIRMAS, firmas: [{ ...FIRMA_PROPIETARIO, vigente: false }] } },
    }));
    dibujarApp("/contratos/1");
    expect(await screen.findByText("Desactualizada")).toBeInTheDocument();
    // La firma vencida no cuenta: el propietario puede firmar el texto nuevo.
    expect(screen.getByRole("button", { name: "FIRMAR CONTRATO" })).toBeInTheDocument();
  });

  it("sin ganado la API no genera el documento y no se ofrece firmar", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1({
      "GET /api/contratos/1/documento": { estado: 409, cuerpo: { detalle: "Registre el ganado del contrato antes de generar el documento", campo: null } },
      "GET /api/contratos/1/firmas": { cuerpo: { ...SIN_FIRMAS, huella_actual: null } },
    }));
    dibujarApp("/contratos/1");
    expect(await screen.findByText("Registre el ganado del contrato antes de generar el documento")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "FIRMAR CONTRATO" })).not.toBeInTheDocument();
  });

  it("el tecnico y el contador leen el documento pero no pueden firmar", async () => {
    entrarComo(USUARIO_CONTADOR);
    simularApi(rutasContrato1());
    dibujarApp("/contratos/1");
    expect(await screen.findByLabelText("Texto del contrato")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "FIRMAR CONTRATO" })).not.toBeInTheDocument();
  });

  it("muestra el mensaje de la API si la firma es rechazada", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1({
      "POST /api/contratos/1/firma": { estado: 409, cuerpo: { detalle: "Solo se firman contratos activos", campo: null } },
    }));
    dibujarApp("/contratos/1");
    await userEvent.click(await screen.findByRole("button", { name: "FIRMAR CONTRATO" }));
    expect(await screen.findByText("Solo se firman contratos activos")).toBeInTheDocument();
  });
});

describe("pagos", () => {
  it("lista los pagos con sus totales por estado", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    simularApi(rutasContrato1());
    dibujarApp("/contratos/1");
    const tabla = await screen.findByRole("table", { name: "Pagos del contrato" });
    expect(within(tabla).getAllByRole("row")).toHaveLength(3);
    expect(within(tabla).getByText("Consignación")).toBeInTheDocument();
    expect(screen.getByText(/Confirmado:/).textContent).toContain("$ 2.210.000,00");
    expect(screen.getByText(/Pendiente:/).textContent).toContain("$ 2.210.000,00");
    expect(within(tabla).queryByRole("button", { name: /Confirmar el pago/ })).not.toBeInTheDocument();
  });

  it("el arrendatario valida y registra un pago que queda pendiente", async () => {
    entrarComo(USUARIO_ARRENDATARIO);
    let lista = PAGOS;
    const api = simularApi(rutasContrato1({
      "GET /api/contratos/1/pagos": () => ({ cuerpo: lista }),
      "POST /api/contratos/1/pagos": (opciones) => {
        const cuerpo = JSON.parse(opciones.body);
        const nuevo = { id_pago: 3, id_contrato: 1, ...cuerpo, estado_pago: "Pendiente" };
        lista = [...lista, nuevo];
        return { estado: 201, cuerpo: nuevo };
      },
    }));
    dibujarApp("/contratos/1");
    await screen.findByRole("table", { name: "Pagos del contrato" });

    await userEvent.click(screen.getByRole("button", { name: "REGISTRAR PAGO" }));
    expect(screen.getByText("La fecha del pago es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("El monto es obligatorio")).toBeInTheDocument();
    expect(llamadas(api, "POST", "/api/contratos/1/pagos")).toHaveLength(0);

    await userEvent.type(screen.getByLabelText("Fecha del pago"), "2026-12-01");
    await userEvent.type(screen.getByLabelText("Monto ($)"), "2210000");
    await userEvent.selectOptions(screen.getByLabelText("Método de pago"), "PSE");
    await userEvent.click(screen.getByRole("button", { name: "REGISTRAR PAGO" }));

    await waitFor(() => expect(within(screen.getByRole("table", { name: "Pagos del contrato" })).getAllByRole("row")).toHaveLength(4));
    expect(JSON.parse(llamadas(api, "POST", "/api/contratos/1/pagos")[0][1].body)).toEqual({
      fecha_pago: "2026-12-01", monto_total: 2210000, metodo_pago: "PSE",
    });
    expect(screen.getByLabelText("Monto ($)")).toHaveValue(null);
  });

  it("el propietario confirma un pago pendiente y el estado cambia", async () => {
    entrarComo(USUARIO_PROPIETARIO);
    let lista = PAGOS;
    const api = simularApi(rutasContrato1({
      "GET /api/contratos/1/pagos": () => ({ cuerpo: lista }),
      "PUT /api/pagos/2/estado": (opciones) => {
        const estado = JSON.parse(opciones.body).estado_pago;
        lista = PAGOS.map((p) => (p.id_pago === 2 ? { ...p, estado_pago: estado } : p));
        return { cuerpo: lista[1] };
      },
    }));
    dibujarApp("/contratos/1");
    expect(screen.queryByRole("button", { name: "REGISTRAR PAGO" })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Confirmar el pago 2" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Confirmar el pago 2" })).not.toBeInTheDocument());
    expect(JSON.parse(llamadas(api, "PUT", "/api/pagos/2/estado")[0][1].body)).toEqual({ estado_pago: "Confirmado" });
    expect(screen.getByText(/Pendiente:/).textContent).toContain("$ 0,00");
  });

  it("el contador puede rechazar y se muestra el error si la API lo impide", async () => {
    entrarComo(USUARIO_CONTADOR);
    simularApi(rutasContrato1({
      "PUT /api/pagos/2/estado": { estado: 409, cuerpo: { detalle: "El pago ya fue resuelto y no se puede cambiar", campo: null } },
    }));
    dibujarApp("/contratos/1");
    await userEvent.click(await screen.findByRole("button", { name: "Rechazar el pago 2" }));
    expect(await screen.findByText("El pago ya fue resuelto y no se puede cambiar")).toBeInTheDocument();
  });
});

describe("reportes financieros", () => {
  it("el propietario ve los totales y la rentabilidad por contrato", async () => {
    entrarComo(USUARIO_PROPIETARIO);
    simularApi(rutasContrato1());
    dibujarApp("/reportes");
    expect(await screen.findByRole("heading", { name: "Reportes financieros" })).toBeInTheDocument();
    expect(screen.getByText(/margen de 20 %/)).toBeInTheDocument();
    expect(screen.getByText("Ingreso total")).toBeInTheDocument();
    const tabla = screen.getByRole("table", { name: "Rentabilidad por contrato" });
    expect(within(tabla).getByText("Potrero La Esperanza")).toBeInTheDocument();
    expect(within(tabla).getByText("Lote Alto El Mirador")).toBeInTheDocument();
    expect(within(tabla).getAllByText("$ 21.900.000,00")).not.toHaveLength(0);
    expect(leer(CLAVES.REPORTE).datos.totales.recaudado).toBe(4370000);
  });

  it("sin red usa el ultimo reporte guardado", async () => {
    entrarComo(USUARIO_CONTADOR);
    guardar(CLAVES.REPORTE, { idUsuario: 4, datos: rutasContrato1()["GET /api/reportes/rentabilidad"].cuerpo });
    simularApi({ RED_CAIDA: true });
    dibujarApp("/reportes");
    expect(await screen.findByText(/Datos guardados en este dispositivo/)).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Rentabilidad por contrato" })).toBeInTheDocument();
  });

  it("sin contratos lo indica en lugar de dibujar una tabla vacia", async () => {
    entrarComo(USUARIO_CONTADOR);
    simularApi(rutasContrato1({
      "GET /api/reportes/rentabilidad": { cuerpo: { margen_utilidad: 0.2, contratos: [], totales: { ingreso_total: 0, costo_estimado: 0, utilidad_proyectada: 0, recaudado: 0, saldo_por_cobrar: 0 } } },
    }));
    dibujarApp("/reportes");
    expect(await screen.findByText("Todavía no hay contratos para reportar.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
