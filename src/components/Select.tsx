"use client";

import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

// Desplegable custom con el lenguaje "sala de máquinas": placa con sombra
// dura, cuña de toggle con acento hazard al hover y panel con franja hazard.
// Mantiene un <select> nativo oculto para conservar la semántica de
// formulario y la accesibilidad (screen readers y envío de forms).
export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  ariaLabel,
}: SelectProps) {
  const [abierto, setAbierto] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const seleccion = options.find((o) => o.value === value);

  useEffect(() => {
    function cerrarPorClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    function cerrarPorTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", cerrarPorClick);
    document.addEventListener("keydown", cerrarPorTecla);
    return () => {
      document.removeEventListener("mousedown", cerrarPorClick);
      document.removeEventListener("keydown", cerrarPorTecla);
    };
  }, []);

  function elegir(v: string) {
    onChange(v);
    setAbierto(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        tabIndex={-1}
        className="sr-only"
      >
        <option value="">{placeholder ?? "Selecciona..."}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        className="group flex w-full items-stretch overflow-hidden rounded-md border border-concrete-300 bg-concrete-50 text-left text-sm text-ink-900 shadow-[3px_3px_0_0_rgba(28,29,32,0.15)] transition outline-none hover:border-ink-700 hover:shadow-[4px_4px_0_0_rgba(28,29,32,0.25)] focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-hazard-400"
      >
        <span
          className={`flex-1 truncate px-3 py-2 ${
            seleccion ? "text-ink-900" : "text-ink-500"
          }`}
        >
          {seleccion ? seleccion.label : (placeholder ?? "Selecciona...")}
        </span>
        <span
          className={`flex shrink-0 items-center border-l border-concrete-300 px-2.5 transition ${
            abierto
              ? "bg-hazard-400 text-ink-900"
              : "bg-concrete-100 text-ink-700 group-hover:bg-hazard-400 group-hover:text-ink-900"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 8l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {abierto && (
        <div className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-md border-2 border-ink-900 bg-concrete-50 shadow-[4px_4px_0_0_rgba(28,29,32,0.35)]">
          <div className="hazard-stripe h-1" />
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {options.length === 0 && (
              <li className="px-3 py-2 font-mono text-xs text-ink-500">
                Sin opciones
              </li>
            )}
            {options.map((o) => {
              const activo = o.value === value;
              return (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={activo}
                  tabIndex={0}
                  onClick={() => elegir(o.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      elegir(o.value);
                    }
                  }}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition focus:outline-none focus-visible:bg-concrete-100 ${
                    activo
                      ? "bg-hazard-400/10 text-ink-900"
                      : "text-ink-700 hover:bg-concrete-100"
                  }`}
                >
                  <span
                    className={`h-3.5 w-0.5 shrink-0 ${
                      activo ? "bg-hazard-500" : "bg-transparent"
                    }`}
                  />
                  <span className="truncate">{o.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
