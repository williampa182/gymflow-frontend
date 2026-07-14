import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Configuración de Vitest para el frontend de GymFlow.
// Miramos el alias `@/*` del tsconfig.json para que los imports del código
// de producción funcionen igual en los tests.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false, // no procesamos CSS real: solo nos importa que el componente renderice
  },
});
