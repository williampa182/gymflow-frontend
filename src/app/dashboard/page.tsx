"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import { PlanResponseDTO, SuscripcionResponseDTO, UsuarioResponseDTO } from "@/types";

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
        // /api/planes lo puede ver cualquier usuario autenticado
        const planesReq = api.get<PlanResponseDTO[]>("/planes", { params: { activo: true } });

        // Estos dos son solo-ADMIN según @PreAuthorize en el backend
        const usuariosReq = esAdmin
          ? api.get<UsuarioResponseDTO[]>("/usuarios")
          : Promise.resolve(null);
        const suscripcionesReq = esAdmin
          ? api.get<SuscripcionResponseDTO[]>("/suscripciones", { params: { estado: "ACTIVA" } })
          : Promise.resolve(null);

        const [planesRes, usuariosRes, suscripcionesRes] = await Promise.all([
          planesReq,
          usuariosReq,
          suscripcionesReq,
        ]);

        setStats({
          totalPlanesActivos: planesRes.data.length,
          totalUsuarios: usuariosRes ? usuariosRes.data.length : null,
          totalSuscripcionesActivas: suscripcionesRes ? suscripcionesRes.data.length : null,
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
    return <p className="text-sm text-gray-500">Cargando estadísticas...</p>;
  }

  if (error) {
    return <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Planes activos"
          value={stats?.totalPlanesActivos}
        />
        <StatCard
          label="Usuarios registrados"
          value={stats?.totalUsuarios}
          restringido={stats?.totalUsuarios === null}
        />
        <StatCard
          label="Suscripciones activas"
          value={stats?.totalSuscripcionesActivas}
          restringido={stats?.totalSuscripcionesActivas === null}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  restringido,
}: {
  label: string;
  value: number | null | undefined;
  restringido?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      {restringido ? (
        <p className="mt-2 text-sm text-gray-400">Solo visible para ADMIN</p>
      ) : (
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      )}
    </div>
  );
}
