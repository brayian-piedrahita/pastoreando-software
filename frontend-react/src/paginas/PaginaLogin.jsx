// Inicio de sesion (prototipo login.html): correo y contrasena. Si la API autentica, navega a la
// pantalla que el usuario pidio antes de ser enviado aqui, o al panel.

import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Boton from "../componentes/Boton.jsx";
import CampoClave from "../componentes/CampoClave.jsx";
import CampoFormulario from "../componentes/CampoFormulario.jsx";
import MarcaPastoreando from "../componentes/MarcaPastoreando.jsx";
import MensajeAviso from "../componentes/MensajeAviso.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import { useSesion } from "../hooks/useSesion.js";
import { ErrorApi, ErrorRed } from "../servicios/clienteApi.js";
import { validarLogin } from "../utilidades/validaciones.js";

export default function PaginaLogin() {
  const { iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { valores, errores, alCambiar, establecerErrores } = useFormulario({ correo: "", contrasena: "" });
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setErrorGeneral("");
    const encontrados = validarLogin(valores);
    establecerErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      await iniciarSesion(valores.correo, valores.contrasena);
      navegar(ubicacion.state?.desde ?? "/panel", { replace: true });
    } catch (error) {
      if (error instanceof ErrorRed) {
        setErrorGeneral("No hay conexión con el servidor. Verifique su red e intente de nuevo.");
      } else if (error instanceof ErrorApi) {
        setErrorGeneral(error.detalle);
      } else {
        throw error;
      }
      setEnviando(false);
    }
  };

  return (
    <main className="pantalla-centrada">
      <section className="tarjeta-acceso">
        <MarcaPastoreando ancho={200} />
        <h2 className="tarjeta-acceso__subtitulo">Iniciar sesión</h2>

        {ubicacion.state?.registrado && (
          <MensajeAviso tipo="exito">Registro exitoso. Ahora puede iniciar sesión.</MensajeAviso>
        )}
        <MensajeAviso tipo="error">{errorGeneral}</MensajeAviso>

        <form className="formulario" onSubmit={alEnviar} noValidate>
          <CampoFormulario etiqueta="Correo electrónico" nombre="correo" tipo="email" icono="usuario"
            autoComplete="username" valor={valores.correo} alCambiar={alCambiar} error={errores.correo} />
          <CampoClave autoComplete="current-password" valor={valores.contrasena} alCambiar={alCambiar}
            error={errores.contrasena} />
          <Boton tipo="submit" cargando={enviando}>INGRESAR</Boton>
          <Boton variante="secundario" alHacerClic={() => navegar("/registro")}>REGISTRARSE</Boton>
        </form>
      </section>
    </main>
  );
}
