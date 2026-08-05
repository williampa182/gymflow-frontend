import { test, expect } from "@playwright/test";

/**
 * Regression coverage for the security headers configured in next.config.ts
 * and the full CSP served from proxy.ts (M2, nonce per request).
 *
 * Los assertions de CSP son por directiva (no match exacto) porque la política
 * difiere entre dev ('unsafe-eval', ws HMR, sin upgrade-insecure-requests) y
 * prod — válidas en ambos ambientes.
 */
test("la respuesta de /login incluye los headers de seguridad configurados", async ({
  request,
}) => {
  const response = await request.get("/login");

  expect(response.status()).toBe(200);
  expect(response.headers()).toMatchObject({
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "strict-transport-security": "max-age=63072000; includeSubDomains",
  });

  const csp = response.headers()["content-security-policy"];
  expect(csp).toBeTruthy();
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("base-uri 'self'");
  expect(csp).toContain("form-action 'self'");
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(csp).toContain("style-src 'self' 'unsafe-inline'");
});

test("los scripts de la app se ejecutan con el nonce de la CSP (sin violaciones)", async ({
  page,
}) => {
  const violaciones: string[] = [];
  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      /Refused to (execute|load|apply|connect)/i.test(msg.text())
    ) {
      violaciones.push(msg.text());
    }
  });

  await page.goto("/login");

  // Hidratación real: el toggle de mostrar contraseña solo funciona con JS
  const input = page.locator("#password");
  await expect(input).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(input).toHaveAttribute("type", "text");

  // El nonce de la CSP debe estar aplicado a los scripts de Next (SSR)
  const scriptsConNonce = await page.locator("script[nonce]").count();
  expect(scriptsConNonce).toBeGreaterThan(0);

  expect(violaciones).toEqual([]);
});
