import { test, expect } from "@playwright/test";

// En CI sin backend (frontend-ci.yml, env CI_SIN_BACKEND=1) el registro
// real no es posible: el test que registra se salta automáticamente.
const CI_SIN_BACKEND = process.env.CI_SIN_BACKEND === "1";

test("un fallo de chunk no deja la app rota: se recupera", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (err) => errores.push(err.message));

  let abortado = false;
  await page.route("**/_next/static/chunks/**", (route) => {
    const url = route.request().url();
    if (
      !abortado &&
      !url.includes("webpack") &&
      !url.includes("main-app") &&
      !url.includes("polyfills")
    ) {
      abortado = true;
      return route.abort();
    }
    return route.continue();
  });

  await page.goto("/login");

  const email = page.getByLabel("Email");
  const botonRecargar = page.getByRole("button", { name: "Recargar" });

  try {
    await expect(botonRecargar).toBeVisible({ timeout: 20_000 });
    await page.unroute("**/_next/static/chunks/**");
    await botonRecargar.click();
  } catch {
    // camino (b): el auto-reload ya dejó la página cargada
  }

  await expect(email).toBeVisible({ timeout: 20_000 });
  expect(errores).toEqual([]);
});

test("registro con recarga completa llega al dashboard con consola limpia", async ({
  page,
}) => {
  test.skip(CI_SIN_BACKEND, "requiere backend real (registro vía proxy)");
  const errores: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errores.push(msg.text());
  });
  page.on("pageerror", (err) => errores.push(err.message));

  const email = `smoketest+${Date.now()}@gymflow.com`;
  const password = "SmokeTest2026Segura!";

  await page.goto("/login");
  await page.getByRole("link", { name: /regístrate/i }).click();
  await page.getByLabel("Nombre").fill("Smoke Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);

  await page.reload();

  await page.getByLabel("Nombre").fill("Smoke Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: /crear cuenta/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  expect(errores).toEqual([]);
});