"use client";

// Sección "Mi carnet" del dashboard (CLIENTE, Fase 5): carga el código
// desde GET /api/asistencias/mi/carnet y lo muestra junto al QR. El código
// sale del backend y nunca del estado local del browser previo a la carga.

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useToast } from "@/lib/toast";
import { cardDark } from "@/lib/ui";
import { CarnetQR } from "@/components/CarnetQR";
import type { CarnetResponseDTO } from "@/types";

function mensajeDeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string };
    return data.message ?? fallback;
  }
  return fallback;
}

export function MiCarnet() {
  const { notificar } = useToast();
  const [carnet, setCarnet] = useState<CarnetResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    api
      .get<CarnetResponseDTO>("/asistencias/mi/carnet")
      .then((res) => {
        if (!cancelado) setCarnet(res.data);
      })
      .catch((err) => {
        if (!cancelado) {
          const mensaje = mensajeDeError(err, "No se pudo cargar tu carnet.");
          setError(mensaje);
          notificar("error", mensaje);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [notificar]);

  return (
    <section className={cardDark} aria-labelledby="mi-carnet">
      <h2 id="mi-carnet" className="font-display text-lg font-bold text-concrete-100">
        Mi carnet
      </h2>
      {error ? (
        <p className="mt-3 text-sm text-concrete-300">{error}</p>
      ) : !carnet ? (
        <p className="mt-3 font-mono text-sm text-concrete-300">Cargando…</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <CarnetQR valor={carnet.codigoCarnet} />
          <div>
            <p className="font-mono text-2xl font-bold tracking-widest text-concrete-50">
              {carnet.codigoCarnet}
            </p>
            <p className="mt-1 text-xs text-concrete-300">
              Presentanos este código o QR en recepción.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}