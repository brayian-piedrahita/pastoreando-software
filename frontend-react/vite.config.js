import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// URL de la API de Pastoreando (FastAPI). La API no habilita CORS, asi que en desarrollo
// Vite reenvia las llamadas /api al servidor: el navegador solo habla con el puerto 5173.
const API = process.env.PASTOREANDO_API || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": { target: API, changeOrigin: true } },
  },
  preview: {
    proxy: { "/api": { target: API, changeOrigin: true } },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/pruebas/configuracion.js",
  },
});
