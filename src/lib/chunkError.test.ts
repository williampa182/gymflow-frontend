import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  esChunkLoadError,
  intentarRecargaUnaVez,
  limpiarFlagRecarga,
} from "./chunkError";

describe("esChunkLoadError", () => {
  it("reconoce por name ChunkLoadError", () => {
    expect(esChunkLoadError({ name: "ChunkLoadError" })).toBe(true);
  });

  it("reconoce los mensajes de fallo de chunk de webpack", () => {
    expect(esChunkLoadError(new Error("Loading chunk 12 failed."))).toBe(true);
    expect(esChunkLoadError(new Error("Loading CSS chunk 3 failed."))).toBe(true);
    expect(
      esChunkLoadError(new Error("Failed to load chunk /_next/static/chunks/x.js"))
    ).toBe(true);
    expect(
      esChunkLoadError(
        new Error("Failed to fetch dynamically imported module: http://localhost:3000/_next/static/chunks/xyz.js")
      )
    ).toBe(true);
  });

  it("rechaza errores genéricos y valores no-error", () => {
    expect(esChunkLoadError(new Error("boom"))).toBe(false);
    expect(esChunkLoadError(null)).toBe(false);
    expect(esChunkLoadError(undefined)).toBe(false);
    expect(esChunkLoadError({ message: "Loading..." })).toBe(false);
  });
});

describe("intentarRecargaUnaVez", () => {
  let reloadMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    reloadMock = vi.fn();
    vi.stubGlobal("location", {
      href: "http://localhost:3000/login",
      reload: reloadMock,
    });
  });

  it("sin flag previo recarga y deja el flag escrito", () => {
    expect(intentarRecargaUnaVez()).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("gymflow:chunk-retry")).not.toBeNull();
  });

  it("con flag reciente no recarga", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00Z"));
    sessionStorage.setItem("gymflow:chunk-retry", String(Date.now()));
    expect(intentarRecargaUnaVez()).toBe(false);
    expect(reloadMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("con flag viejo (más de 60s) recarga de nuevo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00Z"));
    sessionStorage.setItem("gymflow:chunk-retry", String(Date.now() - 61_000));
    expect(intentarRecargaUnaVez()).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("limpiarFlagRecarga elimina el flag", () => {
    sessionStorage.setItem("gymflow:chunk-retry", String(Date.now()));
    limpiarFlagRecarga();
    expect(sessionStorage.getItem("gymflow:chunk-retry")).toBeNull();
  });
});