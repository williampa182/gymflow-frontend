// Clases compartidas del sistema de diseño "sala de máquinas" de GymFlow.
// Centralizarlas aquí evita que cada página reinvente su propio botón o badge.

export const card =
  "rounded-lg border border-concrete-300 bg-concrete-50 p-5";

export const input =
  "input-plate w-full rounded-md px-3 py-2 text-sm text-ink-900 outline-none";

export const label = "mb-1 block text-sm font-medium text-ink-700";

export const buttonPrimary =
  "rounded-md bg-hazard-500 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-hazard-400 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondary =
  "rounded-md border border-concrete-300 bg-concrete-50 px-3 py-1.5 text-sm text-ink-700 transition hover:bg-concrete-100 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonDanger =
  "rounded-md border border-rust-600/30 bg-rust-100 px-3 py-1 text-xs font-medium text-rust-700 transition hover:bg-rust-100/70 disabled:cursor-not-allowed disabled:opacity-50";

export const errorBanner =
  "rounded-md border border-rust-600/30 bg-rust-100 px-4 py-3 text-sm text-rust-700";

// Variante oscura de errorBanner para pantallas de auth (login/registro),
// que usan fondo ink en vez del fondo claro del resto de la app.
export const authErrorBanner =
  "rounded-md border border-rust-600/50 bg-rust-700/20 px-4 py-3 text-sm font-medium text-rust-100";

// Badges de estado — moss (activo/positivo), rust (peligro/cancelado),
// hazard (advertencia/vencido), concrete (neutral)
export function badgeEstado(variante: "moss" | "rust" | "hazard" | "neutral") {
  const base = "inline-flex rounded-full px-2 py-0.5 text-xs font-medium";
  const variantes = {
    moss: "bg-moss-100 text-moss-700",
    rust: "bg-rust-100 text-rust-700",
    hazard: "bg-hazard-400/20 text-hazard-600",
    neutral: "bg-concrete-200 text-ink-500",
  };
  return `${base} ${variantes[variante]}`;
}

export const tableWrap = "overflow-x-auto rounded-lg border border-concrete-300 bg-concrete-50";
export const tableHead = "border-b border-concrete-300 bg-concrete-100 text-ink-500";
export const tableHeadCell = "px-4 py-3 font-medium";
export const tableRowDivide = "divide-y divide-concrete-200";
export const tableCellMuted = "px-4 py-3 text-ink-500 font-mono text-xs";
