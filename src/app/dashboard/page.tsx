"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import { errorBanner } from "@/lib/ui";
import AdminDashboardCharts from "./_components/AdminDashboardCharts";

interface Stats {
  totalUsuarios: number | null; // null = no autorizado a verlo (no-ADMIN)
  totalPlanesActivos: number;
  totalSuscripcionesActivas: number | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarEstadisticas() {
      const rol = getRol();
      const esAdmin = rol === "ADMIN";

      try {
        // Los tres endpoints devuelven Page<T> desde la paginación (3.3) —
        // el array real está en .content, y totalElements ya viene calculado
        // por Spring Data (más preciso que .content.length si hay más de una
        // página, ya que .content solo trae los items de la página actual).
        const planesReq = api.get<{ totalElements: number }>("/planes", { params: { activo: true } });

        const usuariosReq = esAdmin
          ? api.get<{ totalElements: number }>("/usuarios")
          : Promise.resolve(null);
        const suscripcionesReq = esAdmin
          ? api.get<{ totalElements: number }>("/suscripciones", { params: { estado: "ACTIVA" } })
          : Promise.resolve(null);

        const [planesRes, usuariosRes, suscripcionesRes] = await Promise.all([
          planesReq,
          usuariosReq,
          suscripcionesReq,
        ]);

        setStats({
          totalPlanesActivos: planesRes.data.totalElements,
          totalUsuarios: usuariosRes ? usuariosRes.data.totalElements : null,
          totalSuscripcionesActivas: suscripcionesRes ? suscripcionesRes.data.totalElements : null,
        });
      } catch (err) {
        setError("No se pudieron cargar las estadísticas.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    cargarEstadisticas();
  }, []);

  if (loading) {
    return <p className="font-mono text-sm text-ink-500">Cargando estadísticas...</p>;
  }

  if (error) {
    return <p className={errorBanner}>{error}</p>;
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-ink-900">Dashboard</h1>
      <p className="mb-8 text-sm text-ink-500">Resumen general del gimnasio</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <PlateStat label="Planes activos" value={stats?.totalPlanesActivos} variante="hazard" />
        <PlateStat
          label="Usuarios registrados"
          value={stats?.totalUsuarios}
          restringido={stats?.totalUsuarios === null}
          variante="moss"
        />
        <PlateStat
          label="Suscripciones activas"
          value={stats?.totalSuscripcionesActivas}
          restringido={stats?.totalSuscripcionesActivas === null}
          variante="rust"
        />
      </div>

      {getRol() === "ADMIN" && (
        <div className="mt-8">
          <AdminDashboardCharts />
        </div>
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
