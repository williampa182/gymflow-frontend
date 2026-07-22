import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Si el entorno tiene NODE_ENV=production seteado a nivel de sistema
// (pasó en esta máquina), React carga el build de producción, que no
// exporta `act` — @testing-library/react lo necesita y revienta con
// "React.act is not a function". Forzamos "test" acá para no depender
// de la configuración del entorno de quien corra los tests. Next.js
// tipa NODE_ENV como readonly, así que casteamos para poder asignarlo.
(process.env as Record<string, string>).NODE_ENV = "test";

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
