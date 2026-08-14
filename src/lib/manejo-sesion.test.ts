import { describe, expect, it } from "vitest";
import { sesionTerminada } from "./manejo-sesion";

describe("sesionTerminada", () => {
  it("401 → true", () => {
    expect(sesionTerminada({ response: { status: 401, data: null } })).toBe(true);
  });

  it("403 con body vacío o ausente → true", () => {
    expect(sesionTerminada({ response: { status: 403 } })).toBe(true);
    expect(sesionTerminada({ response: { status: 403, data: null } })).toBe(true);
    expect(sesionTerminada({ response: { status: 403, data: "" } })).toBe(true);
    expect(sesionTerminada({ response: { status: 403, data: {} } })).toBe(true);
  });

  it("403 con body JSON de permisos → false", () => {
    expect(
      sesionTerminada({
        response: { status: 403, data: { message: "No tienes permisos para esta acción" } },
      })
    ).toBe(false);
  });

  it("otros casos (429, 5xx, error de red, sin response) → false", () => {
    expect(sesionTerminada({ response: { status: 429 } })).toBe(false);
    expect(sesionTerminada({ response: { status: 500, data: {} } })).toBe(false);
    expect(sesionTerminada(new Error("Network Error"))).toBe(false);
    expect(sesionTerminada(null)).toBe(false);
    expect(sesionTerminada({})).toBe(false);
  });
});