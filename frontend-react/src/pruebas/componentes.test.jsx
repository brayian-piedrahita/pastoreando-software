import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import AvisoNivel from "../componentes/AvisoNivel.jsx";
import BannerConexion from "../componentes/BannerConexion.jsx";
import Boton from "../componentes/Boton.jsx";
import CampoClave from "../componentes/CampoClave.jsx";
import CampoFormulario from "../componentes/CampoFormulario.jsx";
import DesgloseCostos from "../componentes/DesgloseCostos.jsx";
import FormularioCosto from "../componentes/FormularioCosto.jsx";
import InsigniaNivel from "../componentes/InsigniaNivel.jsx";
import LimiteError from "../componentes/LimiteError.jsx";
import MedidorCarga from "../componentes/MedidorCarga.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import MenuLateral from "../componentes/MenuLateral.jsx";
import PanelSugerencias from "../componentes/PanelSugerencias.jsx";
import ResultadoCosto from "../componentes/ResultadoCosto.jsx";
import RutaProtegida from "../componentes/RutaProtegida.jsx";
import SelectorOpciones from "../componentes/SelectorOpciones.jsx";
import TarjetaLote from "../componentes/TarjetaLote.jsx";
import { ProveedorSesion } from "../contexto/ProveedorSesion.jsx";
import { CLAVES, guardar } from "../servicios/almacenLocal.js";
import { CALCULO_CARNE, LOTES, SESION_PROPIETARIO, USUARIO_TECNICO } from "./datos.js";

describe("MedidorCarga", () => {
  it.each([
    ["NORMAL", 40, "medidor--verde"],
    ["ALERTA", 86.7, "medidor--naranja"],
    ["SOBRECARGA", 120, "medidor--rojo"],
  ])("en nivel %s muestra %s % con la clase %s", (nivel, porcentaje, clase) => {
    render(<MedidorCarga porcentaje={porcentaje} nivel={nivel} />);
    const medidor = screen.getByRole("img");
    expect(medidor).toHaveClass(clase);
    expect(medidor).toHaveAccessibleName(/Carga del lote/);
  });

  it("no llena el circulo mas alla del 100 % pero muestra el valor real", () => {
    const { container } = render(<MedidorCarga porcentaje={120} nivel="SOBRECARGA" />);
    expect(container.querySelector(".medidor__trazo")).toHaveAttribute("stroke-dasharray", "100, 100");
    expect(screen.getByText("120 %")).toBeInTheDocument();
  });
});

describe("InsigniaNivel y AvisoNivel", () => {
  it("la insignia muestra el nivel como texto", () => {
    render(<InsigniaNivel nivel="ALERTA" />);
    expect(screen.getByText("ALERTA")).toHaveClass("insignia--naranja");
  });

  it("el aviso no se dibuja con nivel NORMAL", () => {
    const { container } = render(<AvisoNivel nivel="NORMAL" mensaje="Todo bien" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("la sobrecarga se anuncia como alerta y la alerta como estado", () => {
    const { rerender } = render(<AvisoNivel nivel="SOBRECARGA" mensaje="Supera su capacidad" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Supera su capacidad");
    rerender(<AvisoNivel nivel="ALERTA" mensaje="Cerca del limite" />);
    expect(screen.getByRole("status")).toHaveTextContent("Cerca del limite");
  });
});

describe("Boton", () => {
  it("llama a alHacerClic", async () => {
    const alHacerClic = vi.fn();
    render(<Boton alHacerClic={alHacerClic}>INGRESAR</Boton>);
    await userEvent.click(screen.getByRole("button", { name: "INGRESAR" }));
    expect(alHacerClic).toHaveBeenCalledTimes(1);
  });

  it("mientras carga queda deshabilitado y no admite un segundo clic", async () => {
    const alHacerClic = vi.fn();
    render(<Boton cargando alHacerClic={alHacerClic}>CALCULAR</Boton>);
    const boton = screen.getByRole("button");
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute("aria-busy", "true");
    await userEvent.click(boton);
    expect(alHacerClic).not.toHaveBeenCalled();
  });
});

describe("CampoFormulario", () => {
  it("asocia la etiqueta con el campo y muestra el error", () => {
    render(<CampoFormulario etiqueta="Correo" nombre="correo" valor="" alCambiar={() => {}} error="Es obligatorio" />);
    const campo = screen.getByLabelText("Correo");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Es obligatorio");
    expect(campo).toHaveAccessibleDescription("Es obligatorio");
  });

  it("sin error no marca el campo como invalido", () => {
    render(<CampoFormulario etiqueta="Correo" nombre="correo" valor="" alCambiar={() => {}} />);
    expect(screen.getByLabelText("Correo")).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("CampoClave", () => {
  it("el ojo alterna entre contrasena oculta y visible", async () => {
    render(<CampoClave valor="secreto1" alCambiar={() => {}} />);
    const campo = screen.getByLabelText("Contraseña");
    expect(campo).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(campo).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("PanelSugerencias", () => {
  it("oculta la lista hasta pulsar el boton", async () => {
    render(<PanelSugerencias sugerencias={["Reubicar 4 cabezas"]} />);
    expect(screen.queryByText("Reubicar 4 cabezas")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "VER RECOMENDACIONES" }));
    expect(screen.getByText("Reubicar 4 cabezas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OCULTAR RECOMENDACIONES" })).toHaveAttribute("aria-expanded", "true");
  });

  it("no se dibuja sin sugerencias", () => {
    const { container } = render(<PanelSugerencias sugerencias={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("TarjetaLote", () => {
  it("muestra los datos del lote y marca la sobrecarga con borde punteado", () => {
    render(<TarjetaLote lote={LOTES[1]}><span>contenido extra</span></TarjetaLote>);
    expect(screen.getByRole("heading", { name: /Lote Alto El Mirador/ })).toBeInTheDocument();
    expect(screen.getByText("Capacidad: 20 cabezas")).toBeInTheDocument();
    expect(screen.getByText("SOBRECARGA")).toBeInTheDocument();
    expect(screen.getByText("contenido extra")).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveClass("tarjeta-lote--sobrecarga");
  });
});

describe("DesgloseCostos, ResultadoCosto y SelectorOpciones", () => {
  it("dibuja los cuatro rubros por unidad ganadera sin recalcular", () => {
    render(<DesgloseCostos desglose={CALCULO_CARNE.desglose} vista="unidad" total={240000} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("$ 120.000,00")).toBeInTheDocument();
    expect(screen.getByText("$ 240.000,00")).toBeInTheDocument();
  });

  it("en la vista de lote usa el valor de todo el lote", () => {
    render(<DesgloseCostos desglose={CALCULO_CARNE.desglose} vista="lote" total={12000000} />);
    expect(screen.getByText("$ 6.000.000,00")).toBeInTheDocument();
    expect(screen.getByText("$ 12.000.000,00")).toBeInTheDocument();
  });

  it("antes del calculo muestra los rubros sin valores", () => {
    render(<DesgloseCostos desglose={null} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("ResultadoCosto da formato de moneda y la nota del margen", () => {
    render(<ResultadoCosto titulo="Costo unitario calculado" valor={288000} nota="Incluye margen proyectado del 20 %" />);
    expect(screen.getByText("$ 288.000,00")).toBeInTheDocument();
    expect(screen.getByText(/margen proyectado del 20 %/)).toBeInTheDocument();
  });

  it("SelectorOpciones avisa el valor elegido", async () => {
    const alCambiar = vi.fn();
    render(<SelectorOpciones leyenda="Ver costos por:" nombre="vista" valor="unidad" alCambiar={alCambiar}
      opciones={[{ valor: "unidad", texto: "Unidad Ganadera" }, { valor: "lote", texto: "Lote Completo" }]} />);
    expect(screen.getByLabelText("Unidad Ganadera")).toBeChecked();
    await userEvent.click(screen.getByLabelText("Lote Completo"));
    expect(alCambiar).toHaveBeenCalledWith("lote");
  });
});

describe("FormularioCosto", () => {
  const OPCIONES = [{ valor: "Carne", texto: "Carne" }, { valor: "Leche", texto: "Leche" }];

  it("muestra los errores y no calcula si faltan datos", async () => {
    const alCalcular = vi.fn();
    render(<FormularioCosto propositos={OPCIONES} alCalcular={alCalcular} />);
    await userEvent.click(screen.getByRole("button", { name: /CALCULAR COSTOS/ }));
    expect(screen.getByText("La alimentación es obligatoria")).toBeInTheDocument();
    expect(alCalcular).not.toHaveBeenCalled();
  });

  it("entrega los valores cuando son validos", async () => {
    const alCalcular = vi.fn();
    render(<FormularioCosto propositos={OPCIONES} alCalcular={alCalcular} />);
    await userEvent.type(screen.getByLabelText("Alimentación ($)"), "6000000");
    await userEvent.type(screen.getByLabelText("Mantenimiento ($)"), "3000000");
    await userEvent.type(screen.getByLabelText("Servicios ($)"), "1500000");
    await userEvent.type(screen.getByLabelText("Impuestos ($)"), "1500000");
    await userEvent.type(screen.getByLabelText("Cantidad de animales"), "50");
    await userEvent.selectOptions(screen.getByLabelText("Propósito del ganado"), "Leche");
    await userEvent.click(screen.getByRole("button", { name: /CALCULAR COSTOS/ }));

    expect(alCalcular).toHaveBeenCalledWith({
      alimentacion: "6000000", mantenimiento: "3000000", servicios: "1500000", impuestos: "1500000",
      cantidad_animales: "50", proposito: "Leche",
    });
  });

  it("muestra el error que la API asocia a un campo", () => {
    render(<FormularioCosto propositos={OPCIONES} erroresServidor={{ cantidad_animales: "No puede superar 5000" }}
      alCalcular={() => {}} />);
    expect(screen.getByText("No puede superar 5000")).toBeInTheDocument();
  });
});

describe("BannerConexion y MensajeAviso", () => {
  it("el banner aparece solo cuando no hay red", () => {
    render(<BannerConexion />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("alert")).toHaveTextContent(/Sin conexión a internet/);
    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("MensajeAviso usa alert para errores y no se dibuja vacio", () => {
    const { rerender, container } = render(<MensajeAviso tipo="error">Falla</MensajeAviso>);
    expect(screen.getByRole("alert")).toHaveTextContent("Falla");
    rerender(<MensajeAviso tipo="error">{""}</MensajeAviso>);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("LimiteError", () => {
  function Defectuoso({ falla }) {
    if (falla) throw new Error("fallo de prueba");
    return <p>Contenido sano</p>;
  }

  it("muestra el aviso en vez de dejar la pantalla en blanco y permite reintentar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let falla = true;
    const Hijo = () => <Defectuoso falla={falla} />;
    render(<LimiteError><Hijo /></LimiteError>);

    expect(screen.getByRole("alert")).toHaveTextContent("Algo salió mal");
    falla = false;
    await userEvent.click(screen.getByRole("button", { name: "REINTENTAR" }));
    expect(screen.getByText("Contenido sano")).toBeInTheDocument();
  });
});

describe("RutaProtegida y MenuLateral", () => {
  const dibujar = (ruta, roles) =>
    render(
      <ProveedorSesion>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route path="/login" element={<p>Pantalla de acceso</p>} />
            <Route path="/panel" element={<p>Panel</p>} />
            <Route path="/costos" element={<RutaProtegida roles={roles}><p>Costos</p></RutaProtegida>} />
          </Routes>
        </MemoryRouter>
      </ProveedorSesion>,
    );

  it("sin sesion redirige a /login", () => {
    dibujar("/costos");
    expect(screen.getByText("Pantalla de acceso")).toBeInTheDocument();
  });

  it("con sesion y rol permitido muestra el contenido", () => {
    guardar(CLAVES.SESION, SESION_PROPIETARIO);
    dibujar("/costos", ["Propietario"]);
    expect(screen.getByText("Costos")).toBeInTheDocument();
  });

  it("con sesion pero sin el rol redirige al panel", () => {
    guardar(CLAVES.SESION, { token: "t", usuario: USUARIO_TECNICO });
    dibujar("/costos", ["Propietario", "Contador"]);
    expect(screen.getByText("Panel")).toBeInTheDocument();
  });

  it("el menu oculta el modulo contable al tecnico", () => {
    const { rerender } = render(<MemoryRouter><MenuLateral abierto rol="Tecnico" alNavegar={() => {}} /></MemoryRouter>);
    expect(screen.queryByText(/Módulo contable/)).not.toBeInTheDocument();
    expect(screen.getByText(/Monitoreo ambiental/)).toBeInTheDocument();
    rerender(<MemoryRouter><MenuLateral abierto rol="Contador" alNavegar={() => {}} /></MemoryRouter>);
    expect(screen.getByText(/Módulo contable/)).toBeInTheDocument();
  });
});
