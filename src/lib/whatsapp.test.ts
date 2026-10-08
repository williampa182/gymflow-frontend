import { describe, expect, it } from "vitest";
import { enlaceWhatsApp, normalizarTelefonoWA } from "./whatsapp";

describe("lib/whatsapp", () => {
  it("antepone 57 al móvil CO de 10 dígitos", () => {
    expect(normalizarTelefonoWA("3001112233")).toBe("573001112233");
  });

  it("limpia espacios, guiones y paréntesis antes de normalizar", () => {
    expect(normalizarTelefonoWA("300 111-22 33")).toBe("573001112233");
    expect(normalizarTelefonoWA("(601) 234-5678")).toBe("6012345678");
  });

  it("deja tal cual el número que ya trae código país", () => {
    expect(normalizarTelefonoWA("573001112233")).toBe("573001112233");
  });

  it("devuelve null con basura del CSV, null o vacío", () => {
    expect(normalizarTelefonoWA("N/A")).toBeNull();
    expect(normalizarTelefonoWA("no tiene")).toBeNull();
    expect(normalizarTelefonoWA("001814555123456789")).toBeNull();
    expect(normalizarTelefonoWA(null)).toBeNull();
    expect(normalizarTelefonoWA("")).toBeNull();
  });

  it("construye el enlace wa.me con el mensaje codificado (tildes y ñ)", () => {
    const enlace = enlaceWhatsApp("3001112233", "Hola Ana, tu plan vence el 11/10. ¿Seguimos?");
    expect(enlace).toBe(
      "https://wa.me/573001112233?text=Hola%20Ana%2C%20tu%20plan%20vence%20el%2011%2F10.%20%C2%BFSeguimos%3F"
    );
  });

  it("devuelve null si el teléfono no normaliza", () => {
    expect(enlaceWhatsApp("N/A", "Hola")).toBeNull();
    expect(enlaceWhatsApp(null, "Hola")).toBeNull();
  });
});
