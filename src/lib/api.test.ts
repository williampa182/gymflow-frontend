import { afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import api from "./api";

function errorConStatus(status: number, data: unknown): AxiosError {
  return new AxiosError(
    "error de prueba",
    status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      data,
      statusText: status === 401 ? "Unauthorized" : "Forbidden",
      headers: {},
      config: { headers: new AxiosHeaders() },
    }
  );
}

function usarAdapterQueLanza(error: AxiosError) {
  api.defaults.adapter = async () => {
    throw error;
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete api.defaults.adapter;
});

describe("interceptor de api: sesión terminada", () => {
  it("un 401 redirige a /login con sesion=expirada", async () => {
    vi.stubGlobal("location", { href: "" });
    usarAdapterQueLanza(errorConStatus(401, ""));

    await expect(api.get("/planes")).rejects.toBeInstanceOf(AxiosError);
    expect(window.location.href).toBe("/login?sesion=expirada");
  });

  it("un 403 con body vacío (token inválido/expirado) redirige a /login con sesion=expirada", async () => {
    vi.stubGlobal("location", { href: "" });
    usarAdapterQueLanza(errorConStatus(403, ""));

    await expect(api.get("/planes")).rejects.toBeInstanceOf(AxiosError);
    expect(window.location.href).toBe("/login?sesion=expirada");
  });

  it("un 403 con body JSON (permisos) NO redirige", async () => {
    vi.stubGlobal("location", { href: "" });
    usarAdapterQueLanza(errorConStatus(403, { message: "No autorizado" }));

    await expect(api.get("/planes")).rejects.toBeInstanceOf(AxiosError);
    expect(window.location.href).toBe("");
  });

  it("un error de red (sin response) NO redirige", async () => {
    vi.stubGlobal("location", { href: "" });
    usarAdapterQueLanza(new AxiosError("sin red", "ECONNABORTED"));

    await expect(api.get("/planes")).rejects.toBeInstanceOf(AxiosError);
    expect(window.location.href).toBe("");
  });
});