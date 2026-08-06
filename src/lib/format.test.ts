import { describe, it, expect } from "vitest";
import { formatFecha, formatMoneda } from "./format";

describe("helpers de formato", () => {
  it("formatFecha formatea una fecha date-only (YYYY-MM-DD) sin off-by-one", () => {
    expect(formatFecha("2026-08-05")).toBe("5/8/2026");
    expect(formatFecha("2026-08-01")).toBe("1/8/2026");
  });

  it("formatFecha formatea un datetime en zona Bogotá", () => {
    expect(formatFecha("2026-08-05T05:00:00Z")).toBe("5/8/2026");
  });

  it("formatFecha acepta un objeto Date", () => {
    expect(formatFecha(new Date("2026-08-01T05:00:00Z"))).toBe("1/8/2026");
  });

  it("formatMoneda formatea un monto como COP sin decimales", () => {
    expect(formatMoneda(150000)).toContain("150.000");
    expect(formatMoneda(150000)).toContain("$");
  });
});
