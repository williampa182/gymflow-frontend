const LOCALE = "es-CO";

export function formatFecha(iso: string | Date): string {
  return new Date(iso).toLocaleDateString(LOCALE);
}

export function formatMoneda(monto: number): string {
  return monto.toLocaleString(LOCALE, {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}
