"use client";

import { useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import type { SuscripcionResponseDTO, UsuarioResponseDTO } from "@/types";
import { useRequireRole } from "@/lib/useRequireRole";
import { usePageTitle } from "@/lib/usePageTitle";
import { useToast } from "@/lib/toast";
import { formatFecha } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonFilas } from "@/components/Skeleton";
import {
  badgeEstado,
  buttonPrimary,
  cardDark,
  errorBannerDark,
  inputDark as input,
  labelDark as labelClass,
} from "@/lib/ui";

const TIPOS_DOCUMENTO = ["CC", "CE", "TI", "PEP", "PASAPORTE"];

interface SocioPorDocumento extends UsuarioResponseDTO {
  tipoDocumento: string;
  numeroDocumento: string;
  telefono?: string | null;
}

interface SuscripcionRecepcion extends SuscripcionResponseDTO {
  congeladaDesde?: string | null;
}

// Días entre hoy (medianoche local) y la fechaFin "YYYY-MM-DD" (medianoche
// local). NUNCA UTC: new Date("2026-08-05") se parsea como medianoche UTC y
// en Colombia (UTC-5) cae en el día anterior (off-by-one).
function diasRestantes(fechaFin: string): number {
  const [y, m, d] = fechaFin.split("-").map(Number);
  const fin = new Date(y, m - 1, d);
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((fin.getTime() - hoy.getTime()) / 86400000);
}

// De todas las suscripciones del socio se muestra la vigente más lejana
// (ACTIVA o CONGELADA); si no hay ninguna vigente, la más reciente.
function elegirMembresia(subs: SuscripcionRecepcion[]): SuscripcionRecepcion | null {
  if (subs.length === 0) return null;
  const ordenadas = [...subs].sort((a, b) =>
    a.fechaFin < b.fechaFin ? 1 : a.fechaFin > b.fechaFin ? -1 : 0
  );
  return (
    ordenadas.find((s) => s.estado === "ACTIVA" || s.estado === "CONGELADA") ??
    ordenadas[0]
  );
}

type VarianteSemaforo = "moss" | "rust" | "hazard" | "neutral";

function semaforoDe(membresia: SuscripcionRecepcion | null): {
  texto: string;
  variante: VarianteSemaforo;
} {
  if (!membresia) return { texto: "Sin membresía", variante: "rust" };
  if (membresia.estado === "CONGELADA") {
    return {
      texto: membresia.congeladaDesde
        ? `Congelada desde ${formatFecha(membresia.congeladaDesde)}`
        : "Congelada",
      variante: "neutral",
    };
  }
  if (membresia.estado === "CANCELADA") {
    return { texto: "Cancelada", variante: "rust" };
  }
  if (membresia.estado === "VENCIDA") {
    return { texto: "Vencida", variante: "rust" };
  }
  const dias = diasRestantes(membresia.fechaFin);
  if (dias <= 0) return { texto: "Vencida", variante: "rust" };
  if (dias <= 7) return { texto: "Por vencer", variante: "hazard" };
  return { texto: "Activa", variante: "moss" };
}

function textoDias(dias: number): string {
  if (dias < 0) {
    const n = Math.abs(dias);
    return `Vencida hace ${n} ${n === 1 ? "día" : "días"}`;
  }
  if (dias === 0) return "Vence hoy";
  return dias === 1 ? "1 día restante" : `${dias} días restantes`;
}

function mensajeDeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string };
    return data.message ?? fallback;
  }
  return fallback;
}

export default function RecepcionPage() {
  usePageTitle("Recepción");
  const autorizado = useRequireRole("ADMIN");
  const { notificar } = useToast();

  const [tipo, setTipo] = useState("CC");
  const [numero, setNumero] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorMembresia, setErrorMembresia] = useState<string | null>(null);
  const [socio, setSocio] = useState<SocioPorDocumento | null>(null);
  const [membresia, setMembresia] = useState<SuscripcionRecepcion | null>(null);

  async function buscar() {
    const numeroLimpio = numero.trim();
    if (!numeroLimpio) {
      setError("Escribe el número de documento para buscar.");
      setSocio(null);
      setMembresia(null);
      return;
    }
    setBuscando(true);
    setError(null);
    setErrorMembresia(null);
    try {
      const resSocio = await api.get<SocioPorDocumento>("/usuarios/por-documento", {
        params: { tipo, numero: numeroLimpio },
      });
      const encontrado = resSocio.data;
      setSocio(encontrado);
      try {
        const resSubs = await api.get<{ content: SuscripcionRecepcion[] }>(
          `/suscripciones/usuario/${encontrado.id}`
        );
        setMembresia(elegirMembresia(resSubs.data.content ?? []));
      } catch (errSubs) {
        console.error(errSubs);
        setMembresia(null);
        setErrorMembresia("No se pudo cargar la membresía del socio.");
      }
    } catch (err) {
      console.error(err);
      setSocio(null);
      setMembresia(null);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("No se encontró ningún socio con ese documento.");
      } else {
        setError(mensajeDeError(err, "No se pudo buscar al socio."));
      }
    } finally {
      setBuscando(false);
    }
  }

  async function registrarEntrada() {
    if (!socio) return;
    setRegistrando(true);
    try {
      await api.post("/asistencias/admin/marcar", { usuarioId: socio.id });
      notificar("exito", "Entrada registrada.");
      await buscar();
    } catch (err) {
      console.error(err);
      notificar("error", mensajeDeError(err, "No se pudo registrar la entrada."));
    } finally {
      setRegistrando(false);
    }
  }

  if (!autorizado) {
    return <p className="font-mono text-sm text-concrete-300">Verificando acceso…</p>;
  }

  const semaforo = semaforoDe(errorMembresia ? null : membresia);

  return (
    <div>
      <PageHeader
        titulo="Recepción"
        subtitulo="Busca al socio por su documento y registra su entrada."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void buscar();
        }}
        className={`${cardDark} mb-4 flex flex-col gap-3 sm:flex-row sm:items-end`}
      >
        <div className="sm:w-48">
          <label htmlFor="recepcion-tipo" className={labelClass}>
            Tipo de documento
          </label>
          <select
            id="recepcion-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={input}
          >
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="recepcion-numero" className={labelClass}>
            Número de documento
          </label>
          <input
            id="recepcion-numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Escribe el número de documento"
            inputMode="numeric"
            className={input}
          />
        </div>
        <button type="submit" disabled={buscando} className={buttonPrimary}>
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {error && <p className={`mb-4 ${errorBannerDark}`}>{error}</p>}

      {buscando && !socio ? (
        <div className={cardDark}>
          <SkeletonFilas filas={3} />
        </div>
      ) : socio ? (
        <div className={cardDark}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold">{socio.nombre}</h2>
              <p className="mt-1 font-mono text-xs text-concrete-300">
                {socio.tipoDocumento} {socio.numeroDocumento}
              </p>
            </div>
            <span className={badgeEstado(semaforo.variante, "dark")}>
              {semaforo.texto}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-xs text-concrete-300">Plan</dt>
              <dd className="mt-1 text-sm">
                {errorMembresia ? "—" : (membresia?.nombrePlan ?? "Sin plan")}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-concrete-300">Vence</dt>
              <dd className="mt-1 text-sm">
                {errorMembresia || !membresia ? "—" : formatFecha(membresia.fechaFin)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-concrete-300">Días restantes</dt>
              <dd className="mt-1 text-sm">
                {errorMembresia || !membresia
                  ? "—"
                  : textoDias(diasRestantes(membresia.fechaFin))}
              </dd>
            </div>
          </dl>

          {errorMembresia && <p className={`mt-3 ${errorBannerDark}`}>{errorMembresia}</p>}

          <button
            type="button"
            onClick={() => void registrarEntrada()}
            disabled={registrando || buscando}
            className={`mt-4 ${buttonPrimary}`}
          >
            {registrando ? "Registrando…" : "Registrar entrada"}
          </button>
        </div>
      ) : (
        !error && (
          <EmptyState mensaje="Busca un socio por su documento para ver su membresía." />
        )
      )}
    </div>
  );
}
