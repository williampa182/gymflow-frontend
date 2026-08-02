const anilloVariantes = {
  hazard: "border-hazard-400 bg-hazard-400/15",
  moss: "border-moss-600 bg-moss-600/15",
  rust: "border-rust-600 bg-rust-600/15",
} as const;

interface PlateStatProps {
  label: string;
  value: number | null | undefined;
  variante: keyof typeof anilloVariantes;
  detail?: string;
  restringido?: boolean;
  valueFormatter?: (value: number) => string;
}

export function PlateStat({
  label,
  value,
  variante,
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
        className={`h-16 w-16 shrink-0 rounded-full border-[3px] ${anilloVariantes[variante]}`}
        aria-hidden="true"
      />
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
