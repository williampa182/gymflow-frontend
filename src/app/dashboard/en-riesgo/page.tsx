"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useRequireRole } from "@/lib/useRequireRole";
import { usePageTitle } from "@/lib/usePageTitle";
import { formatFecha } from "@/lib/format";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonFilas } from "@/components/Skeleton";
import {
  buttonSecondaryDark,
  cardDark,
  errorBannerDark,
  tableHeadCell,
  tableHeadDark as tableHead,
  tableRowDivideDark as tableRowDivide,
  tableWrapDark as tableWrap,
} from "@/lib/ui";

interface PorVencer {
  usuarioId: number;
  nombre: string;
  nombrePlan: string;
  fechaFin: string;
  diasRestantes: number;
  telefono: string | null;
}

interface Inactivo {
  usuarioId: number;
  nombre: string;
  ultimaAsistencia: string | null;
  diasSinVenir: number;
  telefono: string | null;
}

interface EnRiesgo {
  porVencer: PorVencer[];
  inactivos: Inactivo[];
}

// Un socio puede salir en AMBAS listas (por vencer su plan Y sin venir):
// decisión explícita, sin dedupe — cada sección es independiente y el
// recepcionista elige a quién escribirle. Las CONGELADA no salen acá a
// propósito (riesgo suspendido: no entran ni vencen mientras tanto).
function mensajePorVencer(nombre: string, plan: string, fechaFin: string): string {
  return (
    `Hola ${nombre}, te escribimos del gym: tu plan ${plan} ` +
    `vence el ${formatFecha(fechaFin)}. Renueva en recepción para seguir entrenando sin pausa.`
  );
}

function mensajeInactivo(nombre: string, ultima: string | null, dias: number): string {
  if (!ultima) {
    return (
      `Hola ${nombre}, te escribimos del gym: aún no registramos tu primera visita. ` +
      `¿Te esperamos esta semana?`
    );
  }
  return (
    `Hola ${nombre}, te escribimos del gym: hace ${dias} ` +
    `${dias === 1 ? "día" : "días"} que no vienes. ¿Seguimos con tu plan?`
  );
}

function mensajeDeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string };
    return data.message ?? fallback;
  }
  return fallback;
}

function BotonWhatsApp({ telefono, mensaje }: { telefono: string | null; mensaje: string }) {
  const enlace = enlaceWhatsApp(telefono, mensaje);
  if (!enlace) {
    return <span className="font-mono text-xs text-concrete-300">Sin teléfono</span>;
  }
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escribir por WhatsApp: ${mensaje}`}
      className={buttonSecondaryDark}
    >
      WhatsApp
    </a>
  );
}

export default function EnRiesgoPage() {
  usePageTitle("En riesgo");
  const autorizado = useRequireRole("ADMIN");

  const [datos, setDatos] = useState<EnRiesgo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autorizado) return;
    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<EnRiesgo>("/suscripciones/en-riesgo");
        setDatos(res.data);
      } catch (err) {
        setError(mensajeDeError(err, "No se pudo cargar la lista en riesgo."));
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void cargar();
  }, [autorizado]);

  if (!autorizado) {
    return <p className="font-mono text-sm text-concrete-300">Verificando acceso…</p>;
  }

  if (loading || !datos) {
    return (
      <div>
        <PageHeader titulo="En riesgo" subtitulo="A quién escribirle hoy por WhatsApp" />
        {error && <p className={`mb-4 ${errorBannerDark}`}>{error}</p>}
        <div className={tableWrap}>
          <SkeletonFilas filas={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titulo="En riesgo" subtitulo="A quién escribirle hoy por WhatsApp" />
      {error && <p className={`mb-4 ${errorBannerDark}`}>{error}</p>}

      <h2 className="mb-2 font-display text-xl font-bold text-concrete-100">
        Por vencer ({datos.porVencer.length})
      </h2>
      <div className={`${tableWrap} mb-8`}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={tableHead}>
            <tr>
              <th className={tableHeadCell}>Socio</th>
              <th className={tableHeadCell}>Plan</th>
              <th className={tableHeadCell}>Vence</th>
              <th className={tableHeadCell}>Acción</th>
            </tr>
          </thead>
          <tbody className={tableRowDivide}>
            {datos.porVencer.map((s) => (
              <tr key={s.usuarioId} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3 text-concrete-100">{s.nombre}</td>
                <td className="px-4 py-3 text-concrete-200">{s.nombrePlan}</td>
                <td className="px-4 py-3 font-mono text-xs text-concrete-300">
                  {formatFecha(s.fechaFin)} ({s.diasRestantes}{" "}
                  {s.diasRestantes === 1 ? "día" : "días"})
                </td>
                <td className="px-4 py-3 text-right">
                  <BotonWhatsApp
                    telefono={s.telefono}
                    mensaje={mensajePorVencer(s.nombre, s.nombrePlan, s.fechaFin)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {datos.porVencer.length === 0 && (
          <EmptyState mensaje="Nadie por vencer esta semana." variante="sinDatos" />
        )}
      </div>

      <h2 className="mb-2 font-display text-xl font-bold text-concrete-100">
        Inactivos ({datos.inactivos.length})
      </h2>
      <div className={tableWrap}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={tableHead}>
            <tr>
              <th className={tableHeadCell}>Socio</th>
              <th className={tableHeadCell}>Última visita</th>
              <th className={tableHeadCell}>Acción</th>
            </tr>
          </thead>
          <tbody className={tableRowDivide}>
            {datos.inactivos.map((s) => (
              <tr key={s.usuarioId} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3 text-concrete-100">{s.nombre}</td>
                <td className="px-4 py-3 font-mono text-xs text-concrete-300">
                  {s.ultimaAsistencia ? formatFecha(s.ultimaAsistencia) : "Nunca vino"}
                </td>
                <td className="px-4 py-3 text-right">
                  <BotonWhatsApp
                    telefono={s.telefono}
                    mensaje={mensajeInactivo(s.nombre, s.ultimaAsistencia, s.diasSinVenir)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {datos.inactivos.length === 0 && (
          <EmptyState mensaje="Nadie inactivo. Todo el mundo viene." variante="sinDatos" />
        )}
      </div>

      <div className={`${cardDark} mt-6`}>
        <p className="font-mono text-xs text-concrete-300">
          El botón solo abre el chat con el mensaje listo: el envío lo haces tú desde tu
          WhatsApp.
        </p>
      </div>
    </div>
  );
}
