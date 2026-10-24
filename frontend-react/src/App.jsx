// Declara las rutas y compone los proveedores. No tiene estado propio. El enrutador se monta en
// main.jsx para poder probar App con MemoryRouter.

import { Navigate, Route, Routes } from "react-router";
import BannerConexion from "./componentes/BannerConexion.jsx";
import DisenoPrincipal from "./componentes/DisenoPrincipal.jsx";
import LimiteError from "./componentes/LimiteError.jsx";
import RutaProtegida from "./componentes/RutaProtegida.jsx";
import { ProveedorSesion } from "./contexto/ProveedorSesion.jsx";
import PaginaCalculoCosto from "./paginas/PaginaCalculoCosto.jsx";
import PaginaContratos from "./paginas/PaginaContratos.jsx";
import PaginaDetalleContrato from "./paginas/PaginaDetalleContrato.jsx";
import PaginaLogin from "./paginas/PaginaLogin.jsx";
import PaginaMonitoreoCarga from "./paginas/PaginaMonitoreoCarga.jsx";
import PaginaNoEncontrada from "./paginas/PaginaNoEncontrada.jsx";
import PaginaPanel from "./paginas/PaginaPanel.jsx";
import PaginaRegistro from "./paginas/PaginaRegistro.jsx";
import PaginaReportes from "./paginas/PaginaReportes.jsx";
import PaginaSinConexion from "./paginas/PaginaSinConexion.jsx";
import { ROLES_COSTOS, ROLES_REPORTES } from "./utilidades/permisos.js";

export default function App() {
  return (
    <LimiteError>
      <ProveedorSesion>
        <BannerConexion />
        <Routes>
          <Route path="/" element={<Navigate to="/panel" replace />} />
          <Route path="/login" element={<PaginaLogin />} />
          <Route path="/registro" element={<PaginaRegistro />} />
          <Route path="/sin-conexion" element={<PaginaSinConexion />} />

          <Route
            element={
              <RutaProtegida>
                <DisenoPrincipal />
              </RutaProtegida>
            }
          >
            <Route path="/panel" element={<PaginaPanel />} />
            <Route
              path="/costos"
              element={
                <RutaProtegida roles={ROLES_COSTOS}>
                  <PaginaCalculoCosto />
                </RutaProtegida>
              }
            />
            <Route path="/monitoreo" element={<PaginaMonitoreoCarga />} />
            <Route path="/contratos" element={<PaginaContratos />} />
            <Route path="/contratos/:idContrato" element={<PaginaDetalleContrato />} />
            <Route
              path="/reportes"
              element={
                <RutaProtegida roles={ROLES_REPORTES}>
                  <PaginaReportes />
                </RutaProtegida>
              }
            />
          </Route>

          <Route path="*" element={<PaginaNoEncontrada />} />
        </Routes>
      </ProveedorSesion>
    </LimiteError>
  );
}
