import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function requestWithSession(rol: "ADMIN" | "ENTRENADOR" | "CLIENTE", path: string) {
  const request = new NextRequest(`http://localhost:3000${path}`);
  request.cookies.set("token", "runtime-test-token");
  request.cookies.set("session", JSON.stringify({ id: 1, rol }));
  return request;
}

function requestSinToken(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe("CSP con nonce (M2)", () => {
  it("sirve la CSP completa en rutas fuera de /dashboard (early return)", () => {
    const response = proxy(requestSinToken("/login"));

    const csp = response.headers.get("content-security-policy");
    expect(csp).toBeTruthy();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  });

  it("sirve la CSP en la redirección sin token de /dashboard", () => {
    const response = proxy(requestSinToken("/dashboard"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });

  it("sirve la CSP en la redirección de ruta solo-ADMIN a CLIENTE", () => {
    const response = proxy(requestWithSession("CLIENTE", "/dashboard/usuarios"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });

  it("sirve la CSP en la respuesta de /dashboard con sesión válida", () => {
    const response = proxy(requestWithSession("CLIENTE", "/dashboard/suscripciones"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });
});

describe("proxy de rutas del dashboard", () => {
  it("permite a CLIENTE entrar a sus propias suscripciones", () => {
    const request = requestWithSession("CLIENTE", "/dashboard/suscripciones");

    const response = proxy(request);

    expect(response.headers.get("location")).toBeNull();
  });

  it("mantiene usuarios restringido a ADMIN", () => {
    const request = requestWithSession("CLIENTE", "/dashboard/usuarios");

    const response = proxy(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("mantiene asistencias (Fase 5) restringido a ADMIN", () => {
    const request = requestWithSession("ENTRENADOR", "/dashboard/asistencias");

    const response = proxy(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });
});
