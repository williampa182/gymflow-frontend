"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import {
  esChunkLoadError,
  intentarRecargaUnaVez,
  limpiarFlagRecarga,
} from "@/lib/chunkError";

const estiloBody: CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1rem",
  padding: "2rem",
  textAlign: "center",
  background: "#1c1d20",
  color: "#c2bcae",
  fontFamily: "system-ui, sans-serif",
};

const estiloTitulo: CSSProperties = { color: "#f0b429", margin: 0 };

const estiloTexto: CSSProperties = {
  maxWidth: "28rem",
  fontSize: "0.875rem",
  lineHeight: 1.6,
};

const estiloBoton: CSSProperties = {
  background: "#e0a012",
  color: "#1c1d20",
  border: "none",
  borderRadius: "6px",
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
};

export default function GlobalError({
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

  return (
    <html lang="es">
      <body style={estiloBody}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          GymFlow
        </p>
        <h1 style={estiloTitulo}>
          {esChunk
            ? "Hubo un problema al cargar la aplicación"
            : "Algo salió mal"}
        </h1>
        <p style={estiloTexto}>
          {esChunk
            ? "Un fragmento de la aplicación no pudo cargarse. Recarga para intentarlo de nuevo."
            : "Ocurrió un error inesperado. Intenta de nuevo."}
        </p>
        {esChunk ? (
          <button
            type="button"
            style={estiloBoton}
            onClick={() => {
              limpiarFlagRecarga();
              window.location.reload();
            }}
          >
            Recargar
          </button>
        ) : (
          <button
            type="button"
            style={estiloBoton}
            onClick={reset}
          >
            Reintentar
          </button>
        )}
      </body>
    </html>
  );
}