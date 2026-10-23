// Registro de usuarios (prototipo REGISTRO.HTML). Tecnico y Contador deben ingresar ademas el
// codigo de profesional. Los errores de la API (409 de cedula o correo repetidos, 422 de formato)
// se muestran junto al campo que senala la respuesta.

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Boton from "../componentes/Boton.jsx";
import CampoClave from "../componentes/CampoClave.jsx";
import CampoFormulario from "../componentes/CampoFormulario.jsx";
import CampoSeleccion from "../componentes/CampoSeleccion.jsx";
import MarcaPastoreando from "../componentes/MarcaPastoreando.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import { ErrorApi, ErrorRed } from "../servicios/clienteApi.js";
import { registrarUsuario } from "../servicios/servicioAuth.js";
import { ROLES, requiereCodigoProfesional } from "../utilidades/permisos.js";
import { validarRegistro } from "../utilidades/validaciones.js";

const VALORES_INICIALES = {
  nombre: "",
  apellidos: "",
  cedula: "",
  rol: "",
  correo: "",
  contrasena: "",
  codigo_profesional: "",
};

// El valor que viaja a la API no lleva tilde; el texto que ve el usuario si.
const OPCIONES_ROL = ROLES.map((rol) => ({ valor: rol, texto: rol === "Tecnico" ? "Técnico" : rol }));

export default function PaginaRegistro() {
  const navegar = useNavigate();
  const { valores, errores, alCambiar, establecerErrores } = useFormulario(VALORES_INICIALES);
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral("");
    const encontrados = validarRegistro(valores);
    establecerErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      await registrarUsuario(valores);
      navegar("/login", { replace: true, state: { registrado: true } });
    } catch (error) {
      if (error instanceof ErrorApi && error.campo && error.campo in VALORES_INICIALES) {
        establecerErrores({ [error.campo]: error.detalle });
      } else if (error instanceof ErrorApi) {
        setErrorGeneral(error.detalle);
      } else if (error instanceof ErrorRed) {
        setErrorGeneral("No hay conexión con el servidor. Verifique su red e intente de nuevo.");
      } else {
        throw error;
      }
      setEnviando(false);
    }
  };

  return (
    <main className="pantalla-centrada">
      <section className="tarjeta-acceso tarjeta-acceso--ancha">
        <MarcaPastoreando ancho={160} />
        <h2 className="tarjeta-acceso__subtitulo">Crear cuenta</h2>
        <MensajeAviso tipo="error">{errorGeneral}</MensajeAviso>

        <form className="formulario" onSubmit={alEnviar} noValidate>
          <CampoFormulario etiqueta="Nombre" nombre="nombre" icono="usuario" autoComplete="given-name"
            valor={valores.nombre} alCambiar={alCambiar} error={errores.nombre} />
          <CampoFormulario etiqueta="Apellidos" nombre="apellidos" icono="usuario" autoComplete="family-name"
            valor={valores.apellidos} alCambiar={alCambiar} error={errores.apellidos} />
          <CampoFormulario etiqueta="Cédula" nombre="cedula" icono="tarjeta" inputMode="numeric"
            valor={valores.cedula} alCambiar={alCambiar} error={errores.cedula} />
          <CampoSeleccion etiqueta="Rol" nombre="rol" icono="animal" textoVacio="Seleccione un rol"
            opciones={OPCIONES_ROL} valor={valores.rol} alCambiar={alCambiar} error={errores.rol} />
          {requiereCodigoProfesional(valores.rol) && (
            <CampoFormulario etiqueta="Código de profesional" nombre="codigo_profesional" icono="tarjeta"
              valor={valores.codigo_profesional} alCambiar={alCambiar} error={errores.codigo_profesional} />
          )}
          <CampoFormulario etiqueta="Correo electrónico" nombre="correo" tipo="email" icono="correo"
            autoComplete="email" valor={valores.correo} alCambiar={alCambiar} error={errores.correo} />
          <CampoClave autoComplete="new-password" valor={valores.contrasena} alCambiar={alCambiar}
            error={errores.contrasena} />
          <Boton tipo="submit" cargando={enviando}>REGISTRARSE</Boton>
        </form>
        <p className="tarjeta-acceso__pie">
          ¿Ya tiene cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  );
}
