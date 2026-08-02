import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function requestWithSession(rol: "ADMIN" | "ENTRENADOR" | "CLIENTE", path: string) {
  const request = new NextRequest(`http://localhost:3000${path}`);
  request.cookies.set("token", "runtime-test-token");
  request.cookies.set("session", JSON.stringify({ id: 1, rol }));
  return request;
}

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
});
