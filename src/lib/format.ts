const LOCALE = "es-CO";
const BOGOTA = "America/Bogota";
const FECHA_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Las fechas del backend llegan de dos formas (regla 7, Clock Bogotá):
// - "YYYY-MM-DD" (LocalDate): se interpreta como fecha calendario en Bogotá.
//   Sin el manejador date-only, new Date("2026-08-05") se parsea como
//   medianoche UTC y en Bogotá (UTC-5) muestra el día anterior (off-by-one).
// - Datetime con hora/zona: se formatea en zona Bogotá explícita para que el
//   resultado no dependa de la zona horaria del navegador/CI.
export function formatFecha(iso: string | Date): string {
  if (typeof iso === "string" && FECHA_ONLY.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    const mediodiaLocal = new Date(y, m - 1, d, 12, 0, 0);
    return mediodiaLocal.toLocaleDateString(LOCALE);
  }
  return new Date(iso).toLocaleDateString(LOCALE, { timeZone: BOGOTA });
}

export function formatMoneda(monto: number): string {
  return monto.toLocaleString(LOCALE, {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}
