"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import { errorBanner } from "@/lib/ui";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonStats } from "@/components/Skeleton";
import AdminDashboardCharts from "./_components/AdminDashboardCharts";
import type { DashboardAdminStatsDTO } from "@/types";

interface Stats {
  totalPlanesActivos: number;
  totalUsuarios: number | null; // null = no autorizado a verlo (no-ADMIN)
  totalSuscripcionesActivas: number | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminStats, setAdminStats] = useState<DashboardAdminStatsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function cargarEstadisticas() {
      const rol = getRol();
      const esAdmin = rol === "ADMIN";

      try {
        // Los endpoints de listado devuelven Page<T> desde la paginación (3.3) —
        // el array real está en .content, y totalElements ya viene calculado
        // por Spring Data (más preciso que .content.length si hay más de una
        // página). Las suscripciones activas, en cambio, se derivan del endpoint
        // único de estadísticas: ingresosPorTipoPlan solo cuenta suscripciones
        // ACTIVAS (DashboardAdminService.ingresosPorTipoPlan), así que la suma
        // de cantidadSuscripciones es exactamente el total que antes pedía
        // /suscripciones?estado=ACTIVA — y de paso el DTO se reutiliza para los
        // charts, eliminando el fetch duplicado de AdminDashboardCharts.
        const planesReq = api.get<{ totalElements: number }>("/planes", { params: { activo: true } });

        const usuariosReq = esAdmin
          ? api.get<{ totalElements: number }>("/usuarios")
          : Promise.resolve(null);
        const adminStatsReq = esAdmin
          ? api.get<DashboardAdminStatsDTO>("/dashboard/admin/estadisticas")
          : Promise.resolve(null);

        const [planesRes, usuariosRes, statsRes] = await Promise.all([
          planesReq,
          usuariosReq,
          adminStatsReq,
        ]);
        if (cancelado) return;

        setStats({
          totalPlanesActivos: planesRes.data.totalElements,
          totalUsuarios: usuariosRes ? usuariosRes.data.totalElements : null,
          totalSuscripcionesActivas: statsRes
            ? statsRes.data.ingresosPorTipoPlan.reduce(
                (acc, e) => acc + e.cantidadSuscripciones,
                0
              )
            : null,
        });
        if (statsRes) setAdminStats(statsRes.data);
      } catch (err) {
        if (!cancelado) {
          setError("No se pudieron cargar las estadísticas.");
          console.error(err);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargarEstadisticas();

    return () => {
      cancelado = true;
    };
  }, []);

  if (loading) {
    return <SkeletonStats />;
  }

  return (
    <div>
      <PageHeader titulo="Dashboard" subtitulo="Resumen general del gimnasio" />

      {error && <p className={`mb-4 ${errorBanner}`}>{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <PlateStat label="Planes activos" value={stats.totalPlanesActivos} variante="hazard" />
            <PlateStat
              label="Usuarios registrados"
              value={stats.totalUsuarios}
              restringido={stats.totalUsuarios === null}
              variante="moss"
            />
            <PlateStat
              label="Suscripciones activas"
              value={stats.totalSuscripcionesActivas}
              restringido={stats.totalSuscripcionesActivas === null}
              variante="rust"
            />
          </div>

          {getRol() === "ADMIN" && adminStats && (
            <div className="mt-8">
              <AdminDashboardCharts stats={adminStats} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const anilloVariantes = {
  hazard: "border-hazard-400",
  moss: "border-moss-600",
  rust: "border-rust-600",
};

function PlateStat({
  label,
  value,
  restringido,
  variante,
}: {
  label: string;
  value: number | null | undefined;
  restringido?: boolean;
  variante: "hazard" | "moss" | "rust";
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-concrete-300 bg-concrete-50 p-5">
      {/* Insignia tipo "corte transversal de disco de peso" */}
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] bg-ink-900 ${anilloVariantes[variante]}`}
      >
        {restringido ? (
          <span className="font-mono text-[10px] text-concrete-300">N/A</span>
        ) : (
          <span className="font-display text-2xl font-bold text-concrete-50">{value}</span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        {restringido && (
          <p className="mt-0.5 font-mono text-[11px] text-ink-500">Solo visible para ADMIN</p>
        )}
      </div>
    </div>
  );
}
