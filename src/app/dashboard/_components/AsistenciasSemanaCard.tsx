"use client";

// Tarjeta de asistencias de la semana (Fase 5, P1 del frontend).
// CLIENTE: contador + listado + botón "Registrar entrada" con estados
// pending/ya-marcó (POST /asistencias/mi). ENTRENADOR: semana de sus
// acompañados, solo lectura (GET /asistencias/acompanados/semana).
// La tarjeta recarga al montar y al volver a la pestaña (visibilitychange):
// si el cliente marcó en otra ventana o desde el kiosco, se ve reflejado.

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { formatFecha } from "@/lib/format";
import { useToast } from "@/lib/toast";
import { buttonPrimary, cardDark } from "@/lib/ui";
import { EmptyState } from "@/components/EmptyState";
import type {
  AsistenciaAcompanadoDTO,
  AsistenciaSemanaDTO,
  MetodoAsistencia,
} from "@/types";

const HOY_BOGOTA = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

const ETIQUETA_METODO: Record<MetodoAsistencia, string> = {
  SELF: "App",
  ADMIN: "Recepción",
  KIOSK_CARNET: "Kiosco",
};

function mensajeDeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string };
    return data.message ?? fallback;
  }
  return fallback;
}

function horaDe(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AsistenciasSemanaCard({ rol }: { rol: "CLIENTE" | "ENTRENADOR" }) {
  const { notificar } = useToast();
  const [semana, setSemana] = useState<AsistenciaSemanaDTO | null>(null);
  const [acompanados, setAcompanados] = useState<AsistenciaAcompanadoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        if (rol === "ENTRENADOR") {
          const res = await api.get<AsistenciaAcompanadoDTO[]>("/asistencias/acompanados/semana");
          if (!cancelado) setAcompanados(res.data);
        } else {
          const res = await api.get<AsistenciaSemanaDTO>("/asistencias/mi/semana");
          if (!cancelado) setSemana(res.data);
        }
      } catch (err) {
        if (!cancelado) {
          notificar("error", "No se pudieron cargar las asistencias de la semana.");
          console.error(err);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargar();
    const onVisible = () => {
      if (document.visibilityState === "visible") cargar();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [rol, notificar]);

  async function registrarEntrada() {
    setRegistrando(true);
    try {
      await api.post("/asistencias/mi");
      notificar("exito", "Entrada registrada. ¡Buen entrenamiento!");
      const res = await api.get<AsistenciaSemanaDTO>("/asistencias/mi/semana");
      setSemana(res.data);
    } catch (err) {
      notificar("error", mensajeDeError(err, "No se pudo registrar la entrada."));
    } finally {
      setRegistrando(false);
    }
  }

  const yaMarcadoHoy =
    rol === "CLIENTE" &&
    (semana?.asistencias.some((a) => a.fecha === HOY_BOGOTA()) ?? false);

  return (
    <section className={cardDark} aria-labelledby="asistencias-semana">
      <div className="flex items-center justify-between gap-3">
        <h2 id="asistencias-semana" className="font-display text-lg font-bold text-concrete-100">
          Asistencias esta semana
        </h2>
        {rol === "CLIENTE" && (
          <button
            type="button"
            className={buttonPrimary}
            disabled={registrando || yaMarcadoHoy}
            onClick={registrarEntrada}
          >
            {registrando
              ? "Registrando…"
              : yaMarcadoHoy
                ? "Ya marcaste hoy"
                : "Registrar entrada"}
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-4 font-mono text-sm text-concrete-300">Cargando…</p>
      ) : rol === "ENTRENADOR" ? (
        acompanados.length === 0 ? (
          <EmptyState mensaje="Todavía no tienes clientes acompañados." />
        ) : (
          <ul className="mt-4 space-y-2">
            {acompanados.map((cliente) => (
              <li
                key={cliente.clienteId}
                className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-b-0"
              >
                <span className="text-sm text-concrete-100">{cliente.clienteNombre}</span>
                <span className="font-mono text-xs text-concrete-300">
                  {cliente.asistencias.length}{" "}
                  {cliente.asistencias.length === 1 ? "día" : "días"}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : !semana || semana.total === 0 ? (
        <EmptyState mensaje="Todavía no hay registros de asistencia esta semana." />
      ) : (
        <ul className="mt-4 space-y-2">
          {semana.asistencias.map((asistencia) => (
            <li
              key={asistencia.id}
              className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-b-0"
            >
              <span className="text-sm text-concrete-100">
                {formatFecha(asistencia.fecha)} · {horaDe(asistencia.entradaEn)}
              </span>
              <span className="font-mono text-xs text-concrete-300">
                {ETIQUETA_METODO[asistencia.metodo]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
