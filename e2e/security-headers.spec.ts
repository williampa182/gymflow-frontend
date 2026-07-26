import { test, expect } from "@playwright/test";

/**
 * Regression coverage for the headers configured in next.config.ts. If any of
 * these values is removed or weakened, this request must fail before release.
 */
test("la respuesta de login incluye los headers de seguridad configurados", async ({
  request,
}) => {
  const response = await request.get("/login");

  expect(response.status()).toBe(200);
  expect(response.headers()).toMatchObject({
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "strict-transport-security": "max-age=63072000; includeSubDomains",
    "content-security-policy": "frame-ancestors 'none'",
  });
});
