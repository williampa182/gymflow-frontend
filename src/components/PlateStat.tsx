const iconoTint = {
  hazard: "bg-hazard-400/15",
  moss: "bg-moss-600/15",
  rust: "bg-rust-600/15",
} as const;

export type IconoPlaca = "usuarios" | "planes" | "suscripciones" | "ingresos";

const TINTA_ICONOS = "text-concrete-100";

function IconoSVG({ children, d }: { children?: React.ReactNode; d?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={TINTA_ICONOS}
    >
      {d && <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
      {children}
    </svg>
  );
}

// Iconos de trazo, mismo lenguaje que el sidebar (text-concrete-100 sobre tinte).
const iconosPlaca: Record<IconoPlaca, React.ReactElement> = {
  usuarios: (
    <IconoSVG>
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </IconoSVG>
  ),
  planes: (
    <IconoSVG>
      <rect x="3" y="4" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 8h14M3 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </IconoSVG>
  ),
  suscripciones: (
    <IconoSVG>
      <rect x="4" y="3" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10.5l1.5 1.5L12 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </IconoSVG>
  ),
  ingresos: (
    <IconoSVG>
      <path d="M3 15l4.5-4.5 3 3L17 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7h4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </IconoSVG>
  ),
};

// Sin icono explícito: indicador decorativo neutral (mismo espíritu del círculo original).
function IconoDato() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={TINTA_ICONOS}>
      <circle cx="5" cy="5" r="3.5" fill="currentColor" />
    </svg>
  );
}

interface PlateStatProps {
  label: string;
  value: number | null | undefined;
  variante: keyof typeof iconoTint;
  icono?: IconoPlaca;
  detail?: string;
  restringido?: boolean;
  valueFormatter?: (value: number) => string;
}

export function PlateStat({
  label,
  value,
  variante,
  icono,
  detail,
  restringido = false,
  valueFormatter,
}: PlateStatProps) {
  const mostrarValor = !restringido && value !== null && value !== undefined;
  const displayValue = mostrarValor
    ? valueFormatter
      ? valueFormatter(value)
      : value
    : "N/A";

  return (
    <article className="relative flex items-center gap-4 overflow-hidden rounded-lg border-2 border-ink-700 bg-ink-900 p-5 shadow-[6px_6px_0_0_rgba(0,0,0,0.4)]">
      <span className="rivet absolute left-3 top-3" aria-hidden="true" />
      <span className="rivet absolute right-3 top-3" aria-hidden="true" />
      <span className="rivet absolute bottom-3 left-3" aria-hidden="true" />
      <span className="rivet absolute bottom-3 right-3" aria-hidden="true" />
      <div className="hazard-stripe absolute left-0 right-0 top-0 h-1" />
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${iconoTint[variante]}`}
        aria-hidden="true"
      >
        {icono ? iconosPlaca[icono] : <IconoDato />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-concrete-100">{label}</p>
        <p
          className={`mt-1 break-words font-display text-xl font-bold leading-tight sm:text-2xl ${mostrarValor ? "text-concrete-50" : "text-concrete-300"}`}
          title={mostrarValor ? String(displayValue) : undefined}
        >
          {displayValue}
        </p>
        {detail && <p className="mt-1 font-mono text-[11px] text-concrete-300">{detail}</p>}
        {restringido && !detail && (
          <p className="mt-1 font-mono text-[11px] text-concrete-300">Solo visible para ADMIN</p>
        )}
      </div>
    </article>
  );
}