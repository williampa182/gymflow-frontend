import { test, expect } from "@playwright/test";

/**
 * T11 (B-06): comportamiento real de la app con JWT vencido durante una
 * sesión activa (cookie httpOnly viva + token muerto).
 *
 * Ambiente dedicado (no tocar los dev servers de :3000/:8080):
 *   Backend:  $env:JWT_EXPIRATION='6000'; .\mvnw.cmd spring-boot:run '-Dspring-boot.run.arguments=--server.port=8081'
 *   Frontend: build prod servido en :3002 con BACKEND_URL=http://localhost:8081
 *   Correr:   $env:BASE_URL='http://localhost:3002'; npx playwright test e2e/sesion-expirada.spec.ts
 *
 * El JWT dura 6 s pero la cookie httpOnly dura 24 h: esperando 8 s después
 * del registro/login se reproduce exactamente el escenario de la auditoría
 * (cookie viva, token expirado). Cada test crea SU PROPIO usuario con un
 * email único — nunca usa credenciales reales del proyecto.
 *
 * Si un escenario no termina en /login, es un HALLAZGO a reportar, no un
 * ajuste de este spec para que pase.
 */
test.setTimeout(45_000);

const PASSWORD = "SesionExpira2026Segura!";

async function registrarseYQuedarEnDashboard(page: import("@playwright/test").Page) {
  const email = `sesion-expirada+${Date.now()}@gymflow.test`;
  await page.goto("/register");
  await page.getByLabel("Nombre").fill("Sesion Expirada");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: /crear cuenta/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

async function esperarRedireccionALogin(page: import("@playwright/test").Page) {
  try {
    await page.waitForURL(/\/login/, { timeout: 12_000 });
  } catch {
    console.log(
      `[HALLAZGO] URL final: ${page.url()} | body: ${(await page.locator("body").innerText())
        .slice(0, 200)
        .replace(/\n+/g, " | ")}`
    );
  }
}

test("navegar a /dashboard/planes con JWT vencido termina en /login sin pantalla parcial", async ({
  page,
}) => {
  await registrarseYQuedarEnDashboard(page);
  await page.waitForTimeout(8000);

  await page.goto("/dashboard/planes", { waitUntil: "domcontentloaded" });
  await esperarRedireccionALogin(page);

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByText("Planes disponibles", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Cerrar sesión" })).toHaveCount(0);
});

test("enviar un mensaje de chat con JWT vencido termina en /login", async ({ page }) => {
  await registrarseYQuedarEnDashboard(page);
  await page.waitForTimeout(8000);

  await page.getByRole("button", { name: "Abrir chat de soporte" }).click();
  await page.getByLabel("Mensaje para soporte").fill("Hola, ¿qué planes tenés?");
  await page.getByRole("button", { name: "Enviar" }).click();
  await esperarRedireccionALogin(page);

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cerrar sesión" })).toHaveCount(0);
});

test("recargar /dashboard con JWT vencido termina en /login sin pantalla parcial", async ({
  page,
}) => {
  await registrarseYQuedarEnDashboard(page);
  await page.waitForTimeout(8000);

  await page.reload({ waitUntil: "domcontentloaded" });
  await esperarRedireccionALogin(page);

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByText("Panel del cliente", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Cerrar sesión" })).toHaveCount(0);
});