// Recorrido de punta a punta de la aplicacion con la API simulada: acceso, rutas protegidas,
// calculo de costos, monitoreo, registro y comportamiento sin conexion.

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";
import { CLAVES, guardar, leer } from "../servicios/almacenLocal.js";
import {
  CALCULO_CARNE, ESTRATEGIAS, LOTES, SESION_PROPIETARIO, USUARIO_PROPIETARIO, USUARIO_TECNICO, simularApi,
} from "./datos.js";

const RUTAS_BASE = {
  "GET /api/lotes": { cuerpo: LOTES },
  "GET /api/costos/estrategias": { cuerpo: ESTRATEGIAS },
  "POST /api/costos/calcular": { cuerpo: CALCULO_CARNE },
};

function dibujarApp(ruta = "/") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("acceso y rutas protegidas", () => {
  it("sin sesion cualquier ruta privada lleva al inicio de sesion", async () => {
    simularApi(RUTAS_BASE);
    dibujarApp("/monitoreo");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("muestra los errores de validacion sin llamar a la API", async () => {
    const api = simularApi(RUTAS_BASE);
    dibujarApp("/login");
    await userEvent.click(screen.getByRole("button", { name: "INGRESAR" }));
    expect(screen.getByText("El correo es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });

  it("muestra el 401 de la API cuando las credenciales son incorrectas", async () => {
    simularApi({
      "POST /api/auth/login": { estado: 401, cuerpo: { mensaje: "Error en la autenticación", detalle: "Correo o contraseña incorrectos", campo: null } },
    });
    dibujarApp("/login");
    await userEvent.type(screen.getByLabelText("Correo electrónico"), "carlos@pastoreando.co");
    await userEvent.type(screen.getByLabelText("Contraseña"), "mala1234");
    await userEvent.click(screen.getByRole("button", { name: "INGRESAR" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos");
    expect(leer(CLAVES.SESION)).toBeNull();
  });

  it("avisa cuando no hay conexion con el servidor", async () => {
    simularApi({ RED_CAIDA: true });
    dibujarApp("/login");
    await userEvent.type(screen.getByLabelText("Correo electrónico"), "carlos@pastoreando.co");
    await userEvent.type(screen.getByLabelText("Contraseña"), "Clave2026");
    await userEvent.click(screen.getByRole("button", { name: "INGRESAR" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/No hay conexión con el servidor/);
  });

  it("el boton REGISTRARSE lleva al formulario de registro", async () => {
    simularApi(RUTAS_BASE);
    dibujarApp("/login");
    await userEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));
    expect(screen.getByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
  });
});

describe("recorrido completo de un propietario", () => {
  it("inicia sesion, calcula costos, revisa el monitoreo y cierra sesion", async () => {
    simularApi({
      ...RUTAS_BASE,
      "POST /api/auth/login": { cuerpo: { mensaje: "Autenticación satisfactoria", token: "abc", tipo: "bearer", usuario: USUARIO_PROPIETARIO } },
    });
    dibujarApp("/");

    // "/" redirige a /panel y como no hay sesion termina en el inicio de sesion
    await userEvent.type(await screen.findByLabelText("Correo electrónico"), "carlos.ramirez@pastoreando.co");
    await userEvent.type(screen.getByLabelText("Contraseña"), "Pastoreando2026*");
    await userEvent.click(screen.getByRole("button", { name: "INGRESAR" }));

    // Panel: indicadores calculados con los lotes de la API
    expect(await screen.findByRole("heading", { name: "Panel de control" })).toBeInTheDocument();
    expect(await screen.findByText("26 ha")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument(); // 26 + 24 + 0 cabezas
    expect(screen.getByText("Lotes en alerta o sobrecarga").previousElementSibling).toHaveTextContent("2");

    // Costos (RF01 y RF02)
    await userEvent.click(screen.getByRole("link", { name: /Módulo contable/ }));
    expect(await screen.findByRole("heading", { name: "Módulo contable integral" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Alimentación ($)"), "6000000");
    await userEvent.type(screen.getByLabelText("Mantenimiento ($)"), "3000000");
    await userEvent.type(screen.getByLabelText("Servicios ($)"), "1500000");
    await userEvent.type(screen.getByLabelText("Impuestos ($)"), "1500000");
    await userEvent.type(screen.getByLabelText("Cantidad de animales"), "50");
    await userEvent.click(screen.getByRole("button", { name: /CALCULAR COSTOS/ }));

    expect(await screen.findByText("$ 288.000,00")).toBeInTheDocument();
    expect(screen.getByText(/margen proyectado del 20 %/)).toBeInTheDocument();
    expect(screen.getAllByText("Alimentación").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByLabelText("Lote Completo"));
    expect(screen.getByText("$ 14.400.000,00")).toBeInTheDocument();
    expect(screen.getByText("Costo total del lote")).toBeInTheDocument();

    // Monitoreo (RF04)
    await userEvent.click(screen.getByRole("link", { name: /Monitoreo ambiental/ }));
    expect(await screen.findByRole("heading", { name: "Monitoreo ambiental y sobrecarga" })).toBeInTheDocument();
    const tarjetaSobrecarga = (await screen.findByRole("heading", { name: /Lote Alto El Mirador/ })).closest("article");
    expect(within(tarjetaSobrecarga).getByText("SOBRECARGA")).toBeInTheDocument();
    expect(within(tarjetaSobrecarga).getByText("120 %")).toBeInTheDocument();
    await userEvent.click(within(tarjetaSobrecarga).getByRole("button", { name: "VER RECOMENDACIONES" }));
    expect(within(tarjetaSobrecarga).getByText(/Reubicar al menos 4/)).toBeInTheDocument();

    // Cerrar sesion
    await userEvent.click(screen.getByRole("button", { name: /Cerrar sesión/ }));
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(leer(CLAVES.SESION)).toBeNull();
  });

  it("muestra el error 422 de la API junto al campo", async () => {
    simularApi({
      ...RUTAS_BASE,
      "POST /api/costos/calcular": { estado: 422, cuerpo: { detalle: "No puede superar 5,000", campo: "cantidad_animales" } },
    });
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    dibujarApp("/costos");
    for (const [etiqueta, valor] of [["Alimentación ($)", "1"], ["Mantenimiento ($)", "1"], ["Servicios ($)", "1"], ["Impuestos ($)", "1"], ["Cantidad de animales", "9999"]]) {
      await userEvent.type(await screen.findByLabelText(etiqueta), valor);
    }
    await userEvent.click(screen.getByRole("button", { name: /CALCULAR COSTOS/ }));
    expect(await screen.findByText("No puede superar 5,000")).toBeInTheDocument();
  });
});

describe("calculo de costos con datos que dejan de ser validos", () => {
  it("quita el resultado anterior cuando el siguiente intento no pasa la validacion", async () => {
    simularApi(RUTAS_BASE);
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    dibujarApp("/costos");
    for (const [etiqueta, valor] of [
      ["Alimentación ($)", "6000000"], ["Mantenimiento ($)", "3000000"], ["Servicios ($)", "1500000"],
      ["Impuestos ($)", "1500000"], ["Cantidad de animales", "50"],
    ]) {
      await userEvent.type(await screen.findByLabelText(etiqueta), valor);
    }
    await userEvent.click(screen.getByRole("button", { name: /CALCULAR COSTOS/ }));
    expect(await screen.findByText("$ 288.000,00")).toBeInTheDocument();

    // Con 0 animales el formulario se rechaza y ya no debe verse el calculo de los 50 animales.
    const animales = screen.getByLabelText("Cantidad de animales");
    await userEvent.clear(animales);
    await userEvent.type(animales, "0");
    await userEvent.click(screen.getByRole("button", { name: /CALCULAR COSTOS/ }));
    expect(await screen.findByText("Debe ser mayor o igual a 1")).toBeInTheDocument();
    expect(screen.queryByText("$ 288.000,00")).not.toBeInTheDocument();
    expect(screen.getByText("Ingrese los valores y presione calcular")).toBeInTheDocument();
  });
});

describe("permisos por rol", () => {
  it("el tecnico no ve el modulo contable y /costos lo devuelve al panel", async () => {
    simularApi(RUTAS_BASE);
    guardar(CLAVES.SESION, { token: "t", usuario: USUARIO_TECNICO });
    dibujarApp("/costos");
    expect(await screen.findByRole("heading", { name: "Panel de control" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Módulo contable/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Monitoreo ambiental/ })).toBeInTheDocument();
  });
});

describe("registro de usuarios", () => {
  async function llenarRegistro(rol = "Arrendatario") {
    await userEvent.type(screen.getByLabelText("Nombre"), "Ana");
    await userEvent.type(screen.getByLabelText("Apellidos"), "Londoño Ruiz");
    await userEvent.type(screen.getByLabelText("Cédula"), "1112223334");
    await userEvent.selectOptions(screen.getByLabelText("Rol"), rol);
    await userEvent.type(screen.getByLabelText("Correo electrónico"), "ana.londono@pastoreando.co");
    await userEvent.type(screen.getByLabelText("Contraseña"), "ClaveSegura2026");
  }

  it("valida el formulario y pide el codigo solo a roles profesionales", async () => {
    simularApi(RUTAS_BASE);
    dibujarApp("/registro");
    expect(screen.queryByLabelText("Código de profesional")).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Rol"), "Contador");
    expect(screen.getByLabelText("Código de profesional")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));
    expect(screen.getByText("Los apellidos son obligatorios")).toBeInTheDocument();
    expect(screen.getByText("Este rol requiere el código de profesional")).toBeInTheDocument();
  });

  it("registra al usuario y vuelve al inicio de sesion con un aviso de exito", async () => {
    const api = simularApi({ "POST /api/auth/registro": { estado: 201, cuerpo: { mensaje: "ok", usuario: USUARIO_PROPIETARIO } } });
    dibujarApp("/registro");
    await llenarRegistro();
    await userEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));

    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(screen.getByText(/Registro exitoso/)).toBeInTheDocument();
    expect(JSON.parse(api.mock.calls[0][1].body)).toMatchObject({ rol: "Arrendatario", codigo_profesional: null });
  });

  it("muestra el 409 de la API junto al campo cedula", async () => {
    simularApi({ "POST /api/auth/registro": { estado: 409, cuerpo: { detalle: "La cédula ya está registrada", campo: "cedula" } } });
    dibujarApp("/registro");
    await llenarRegistro();
    await userEvent.click(screen.getByRole("button", { name: "REGISTRARSE" }));
    expect(await screen.findByText("La cédula ya está registrada")).toBeInTheDocument();
    expect(screen.getByLabelText("Cédula")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("resiliencia sin conexion (RNF01)", () => {
  it("sin red y con copia local muestra los lotes guardados con su aviso", async () => {
    simularApi({ RED_CAIDA: true });
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    guardar(CLAVES.LOTES, { idUsuario: 1, lotes: LOTES });
    dibujarApp("/monitoreo");
    expect(await screen.findByText(/Datos guardados en este dispositivo/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Lote Alto El Mirador/ })).toBeInTheDocument();
  });

  it("sin red y sin copia lleva a la pantalla de error de conexion y permite volver", async () => {
    const rutas = { ...RUTAS_BASE, RED_CAIDA: true };
    simularApi(rutas);
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    dibujarApp("/monitoreo");
    expect(await screen.findByRole("heading", { name: "¡Ha ocurrido un inconveniente!" })).toBeInTheDocument();

    rutas.RED_CAIDA = false; // regresa la senal
    await userEvent.click(screen.getByRole("button", { name: /REINTENTAR CONEXIÓN/ }));
    expect(await screen.findByRole("heading", { name: "Monitoreo ambiental y sobrecarga" })).toBeInTheDocument();
  });

  it("una sesion vencida (401) cierra la sesion y lleva al inicio de sesion", async () => {
    simularApi({ "GET /api/lotes": { estado: 401, cuerpo: { detalle: "Sesión vencida", campo: null } } });
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    dibujarApp("/panel");
    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    await waitFor(() => expect(leer(CLAVES.SESION)).toBeNull());
  });
});

describe("ruta inexistente", () => {
  it("muestra la pagina de no encontrada con un enlace al panel", async () => {
    simularApi(RUTAS_BASE);
    dibujarApp("/no-existe");
    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "IR AL PANEL" })).toHaveAttribute("href", "/panel");
  });
});
