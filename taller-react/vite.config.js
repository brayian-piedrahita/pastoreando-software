import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuracion de Vite y de las pruebas (Vitest sobre un DOM simulado con jsdom)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/pruebas/configuracion.js",
  },
});
