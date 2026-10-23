// Error de conexion (prototipo error_conexion.html). Explica que los datos se conservan y ofrece
// reintentar la pantalla que se estaba abriendo o volver al inicio.

import { useLocation, useNavigate } from "react-router";
import Boton from "../componentes/Boton.jsx";
import Icono from "../componentes/Icono.jsx";
import { useSesion } from "../hooks/useSesion.js";

export default function PaginaSinConexion() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const inicio = usuario ? "/panel" : "/login";

  return (
    <main className="pantalla-centrada">
      <section className="tarjeta-aviso">
        <Icono nombre="alerta" tamano={72} className="tarjeta-aviso__icono" />
        <h1>¡Ha ocurrido un inconveniente!</h1>
        <p>No hay conexión a internet en este momento.</p>
        <p>
          <strong>No te preocupes</strong>, tus datos se han guardado localmente de forma segura y se
          sincronizarán en cuanto recuperes la señal.
        </p>
        <Boton icono="refrescar" alHacerClic={() => navegar(ubicacion.state?.desde ?? inicio, { replace: true })}>
          REINTENTAR CONEXIÓN
        </Boton>
        <Boton variante="secundario" alHacerClic={() => navegar(inicio, { replace: true })}>
          VOLVER AL INICIO
        </Boton>
      </section>
    </main>
  );
}
