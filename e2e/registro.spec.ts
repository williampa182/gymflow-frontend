import { test, expect } from "@playwright/test";

/**
 * Journey 1 de docs/USER_JOURNEYS.md: un visitante anónimo se registra
 * y termina viendo su dashboard. Este test existe porque este journey
 * completo se rompió en silencio durante semanas (faltaba /register)
 * sin que ningún test unitario ni verificación manual de componentes
 * lo detectara. Si esta prueba falla, algo en el flujo de entrada de
 * usuarios nuevos está roto — tratar como bloqueante.
 */
test("un usuario nuevo puede registrarse y llegar a su dashboard", async ({
  page,
}) => {
  const email = `smoketest+${Date.now()}@gymflow.com`;
  const password = "SmokeTest2026Segura!";

  await page.goto("/login");

  // El link "¿No tienes cuenta?" debe existir y llevar a /register.
  await page.getByRole("link", { name: /regístrate/i }).click();
  await expect(page).toHaveURL(/\/register$/);

  await page.getByLabel("Nombre").fill("Smoke Test");
  await page.getByLabel("Email").fill(email);
  // exact: true — el toggle "Mostrar contraseña" (aria-label) contiene el
  // substring "Contraseña" y rompía el match estricto por defecto.
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: /crear cuenta/i }).click();

  // Registro exitoso debe dejar al usuario logueado y en su dashboard,
  // no de vuelta en /login ni en una pantalla de error.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
});
