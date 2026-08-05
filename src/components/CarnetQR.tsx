"use client";

// QR del carnet digital (Fase 5). Se genera client-side con la lib `qrcode`
// para no quemar requests ni exponer el código en el servidor de Next: el
// código llega al browser desde el backend (GET /mi/carnet o el reimpreso
// del ADMIN) y acá se rasteriza a canvas.

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function CarnetQR({ valor, tamaño = 160 }: { valor: string; tamaño?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelado = false;
    QRCode.toCanvas(canvas, valor, { width: tamaño, margin: 1 })
      .catch((error) => {
        // Fallback silencioso: el código en texto siempre está visible al
        // lado del QR; el canvas fallido no debe romper la tarjeta.
        if (!cancelado) console.error("No se pudo generar el QR:", error);
      });
    return () => {
      cancelado = true;
    };
  }, [valor, tamaño]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="carnet-qr"
      aria-label={`Código QR del carnet ${valor}`}
      className="rounded-sm border-2 border-ink-700 bg-white p-2"
    />
  );
}
