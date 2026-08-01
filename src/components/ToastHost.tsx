"use client";

import { useToast } from "@/lib/toast";

const indicadorTipo = {
  exito: "bg-moss-600",
  error: "bg-rust-600",
  info: "bg-hazard-400",
} as const;

// Host de notificaciones — mismo lenguaje físico que el panel del chat:
// esquina inferior derecha, sombra dura desplazada. Los toasts son oscuros
// (ink) para destacar sobre el concreto de las páginas, con un punto de
// color según tipo (moss éxito / rust error / hazard info).
export function ToastHost() {
  const { toasts, quitar } = useToast();

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 right-4 left-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-96"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-md border-2 border-ink-700 bg-ink-900 px-4 py-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]"
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${indicadorTipo[t.tipo]}`}
          />
          <p className="flex-1 text-sm text-concrete-50">{t.mensaje}</p>
          <button
            onClick={() => quitar(t.id)}
            aria-label="Cerrar notificación"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-concrete-300 transition hover:bg-white/5 hover:text-concrete-50"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
