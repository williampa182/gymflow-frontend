import { defineConfig, devices } from "@playwright/test";

/**
 * Config mínima para smoke tests E2E de journeys críticos.
 * Ver docs/USER_JOURNEYS.md (repo backend) para la lista de journeys
 * y cuáles ya tienen test automatizado.
 *
 * Por defecto corre contra localhost:3000 (dev server). Para correr
 * contra otro ambiente, exportar BASE_URL antes de ejecutar:
 *   $env:BASE_URL="https://gymflow-frontend-ten.vercel.app"; npx playwright test
 *
 * En CI (frontend-ci.yml) corren solo los specs autónomos
 * (security-headers y chunk-error-recovery) contra `next start`.
 * registro.spec.ts y sesion-expirada.spec.ts requieren backend real
 * (y sesion-expirada un ambiente dedicado con JWT_EXPIRATION=6000):
 * correrlos manualmente según la cabecera de cada spec.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
