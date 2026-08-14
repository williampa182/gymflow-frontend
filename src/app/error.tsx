"use client";

import { useEffect } from "react";
import {
  esChunkLoadError,
  intentarRecargaUnaVez,
  limpiarFlagRecarga,
} from "@/lib/chunkError";
import { buttonPrimary, buttonSecondaryDark } from "@/lib/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const esChunk = esChunkLoadError(error);

  useEffect(() => {
    if (esChunk) {
      intentarRecargaUnaVez();
    }
  }, [esChunk]);

  if (esChunk) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-900 p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-concrete-300">
          GymFlow
        </p>
        <h1 className="font-display text-3xl font-bold text-hazard-400">
          Hubo un problema al cargar la aplicación
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-concrete-300">
          Un fragmento de la aplicación no pudo cargarse. Recarga para
          intentarlo de nuevo.
        </p>
        <button
          type="button"
          onClick={() => {
            limpiarFlagRecarga();
            window.location.reload();
          }}
          className={buttonPrimary}
        >
          Recargar
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-900 p-8 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-concrete-300">
        GymFlow
      </p>
      <h1 className="font-display text-3xl font-bold text-hazard-400">
        Algo salió mal
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-concrete-300">
        Ocurrió un error inesperado. Intenta de nuevo.
      </p>
      <button type="button" onClick={reset} className={buttonSecondaryDark}>
        Reintentar
      </button>
    </div>
  );
}