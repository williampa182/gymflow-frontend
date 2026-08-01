import { describe, it, expect } from "vitest";
import { formatFecha, formatMoneda } from "./format";

describe("helpers de formato", () => {
  it("formatFecha formatea una fecha en locale es-CO", () => {
    expect(formatFecha("2026-08-01T00:00:00")).toBe("1/8/2026");
  });

  it("formatFecha acepta un objeto Date", () => {
    expect(formatFecha(new Date(2026, 7, 1))).toBe("1/8/2026");
  });

  it("formatMoneda formatea un monto como COP sin decimales", () => {
    expect(formatMoneda(150000)).toContain("150.000");
    expect(formatMoneda(150000)).toContain("$");
  });
});
