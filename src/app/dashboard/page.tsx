"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import { usePageTitle } from "@/lib/usePageTitle";
import { useRequireRole } from "@/lib/useRequireRole";
import { useToast } from "@/lib/toast";
import { formatFecha, formatMoneda } from "@/lib/format";
import { buttonSecondaryDark, cardDark, errorBannerDark } from "@/lib/ui";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PlateStat } from "@/components/PlateStat";
import { SkeletonStats } from "@/components/Skeleton";
import type { DashboardAdminStatsDTO, Rol, SuscripcionResponseDTO } from "@/types";
import AdminDashboardCharts from "./_components/AdminDashboardCharts";
import { AsistenciasSemanaCard } from "./_components/AsistenciasSemanaCard";
import { MiCarnet } from "./_components/MiCarnet";

const ROLES_PERMITIDOS: Rol[] = ["ADMIN", "CLIENTE", "ENTRENADOR"];
const MIN_BOOT_SKELETON_MS = 300;

interface PageResponse<T> {
  content: T[];
  totalElements?: number;
}

interface AdminDashboardData {
  planesActivos: number;
  estadisticas: DashboardAdminStatsDTO;
}

export default function DashboardPage() {
  const rol = getRol() ?? "CLIENTE";
  const esAdmin = rol === "ADMIN";
  const autorizado = useRequireRole(ROLES_PERMITIDOS, "/login");
  const { notificar } = useToast();
  const titulo = esAdmin
    ? "Dashboard"
    : rol === "ENTRENADOR"
      ? "Panel del entrenador"
      : "Panel del cliente";
  const subtitulo = esAdmin ? "Resumen general del gimnasio" : "Mi cuenta y mi suscripción";

  usePageTitle(titulo);

  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [suscripciones, setSuscripciones] = useState<SuscripcionResponseDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!autorizado) return;

    let cancelado = false;
    const inicio = Date.now();

    async function cargarDashboard() {
      try {
        if (esAdmin) {
          const [planesRes, estadisticasRes] = await Promise.all([
            api.get<PageResponse<unknown>>(`/planes`, { params: { activo: true } }),
            api.get<DashboardAdminStatsDTO>("/dashboard/admin/estadisticas"),
          ]);

          if (cancelado) return;
          setAdminData({
            planesActivos: planesRes.data.totalElements ?? planesRes.data.content.length,
            estadisticas: estadisticasRes.data,
          });
        } else {
          const suscripcionesRes = await api.get<PageResponse<SuscripcionResponseDTO>>(
            "/suscripciones/mis"
          );

          if (cancelado) return;
          setSuscripciones(suscripcionesRes.data.content);
        }
      } catch (err) {
        if (!cancelado) {
          const mensaje = "No se pudieron cargar las estadísticas.";
          setError(mensaje);
          notificar("error", mensaje);
          console.error(err);
        }
      } finally {
        const restante = Math.max(0, MIN_BOOT_SKELETON_MS - (Date.now() - inicio));
        window.setTimeout(() => {
          if (!cancelado) setLoading(false);
        }, restante);
      }
    }

    cargarDashboard();

    return () => {
      cancelado = true;
    };
  }, [autorizado, esAdmin, notificar]);

  if (!autorizado || loading) {
    return (
      <div data-testid="dashboard-skeleton" aria-busy="true" aria-label="Cargando dashboard">
        <SkeletonStats tarjetas={esAdmin ? 4 : 3} />
      </div>
    );
  }

  const estadisticas = adminData?.estadisticas;
  const usuariosActivos = estadisticas?.usuariosPorRol.reduce(
    (total, item) => total + item.cantidad,
    0
  ) ?? 0;
  const suscripcionesActivas = estadisticas?.ingresosPorTipoPlan.reduce(
    (total, item) => total + item.cantidadSuscripciones,
    0
  ) ?? 0;
  const ingresosEstimados = estadisticas?.ingresosPorTipoPlan.reduce(
    (total, item) => total + Number(item.ingresoEstimado),
    0
  ) ?? 0;

  return (
    <div>
      <PageHeader titulo={titulo} subtitulo={subtitulo} />

      {error && <p className={`mb-4 ${errorBannerDark}`}>{error}</p>}

      {esAdmin ? (
        <AdminDashboard
          data={adminData}
          usuariosActivos={usuariosActivos}
          suscripcionesActivas={suscripcionesActivas}
          ingresosEstimados={ingresosEstimados}
        />
      ) : (
        <UserDashboard suscripciones={suscripciones} rol={rol} />
      )}
    </div>
  );
}

function AdminDashboard({
  data,
  usuariosActivos,
  suscripcionesActivas,
  ingresosEstimados,
}: {
  data: AdminDashboardData | null;
  usuariosActivos: number;
  suscripcionesActivas: number;
  ingresosEstimados: number;
}) {
  if (!data) {
    return <EmptyState mensaje="Todavía no hay datos del gimnasio para mostrar." />;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <PlateStat
          label="Usuarios activos"
          value={usuariosActivos}
          variante="moss"
          icono="usuarios"
        />
        <PlateStat
          label="Planes activos"
          value={data.planesActivos}
          variante="hazard"
          icono="planes"
        />
        <PlateStat
          label="Suscripciones activas"
          value={suscripcionesActivas}
          variante="rust"
          icono="suscripciones"
        />
        <PlateStat
          label="Ingresos estimados"
          value={ingresosEstimados}
          variante="hazard"
          icono="ingresos"
          valueFormatter={formatMoneda}
        />
      </div>

      <section className="mt-8" aria-labelledby="accesos-rapidos">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="accesos-rapidos" className="font-display text-xl font-bold text-concrete-100">
            Accesos rápidos
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/planes" className={buttonSecondaryDark}>
            Gestionar planes
          </Link>
          <Link href="/dashboard/suscripciones" className={buttonSecondaryDark}>
            Gestionar suscripciones
          </Link>
          <Link href="/dashboard/usuarios" className={buttonSecondaryDark}>
            Gestionar usuarios
          </Link>
        </div>
      </section>

      <div className="mt-8">
        <AdminDashboardCharts stats={data.estadisticas} />
      </div>
    </>
  );
}

function UserDashboard({
  suscripciones,
  rol,
}: {
  suscripciones: SuscripcionResponseDTO[];
  rol: Rol;
}) {
  const suscripcionActiva = suscripciones.find((item) => item.estado === "ACTIVA");

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={cardDark} aria-labelledby="mi-plan-actual">
          <h2 id="mi-plan-actual" className="font-display text-lg font-bold text-concrete-100">
            Mi plan actual
          </h2>
          {suscripcionActiva ? (
            <>
              <p className="mt-3 font-display text-2xl font-bold text-concrete-100">
                {suscripcionActiva.nombrePlan}
              </p>
              <p className="mt-1 font-mono text-xs text-concrete-300">
                Desde {formatFecha(suscripcionActiva.fechaInicio)}
              </p>
            </>
          ) : (
            <EmptyState mensaje="No tienes un plan activo." />
          )}
        </section>

        <section className={cardDark} aria-labelledby="proximo-vencimiento">
          <h2 id="proximo-vencimiento" className="font-display text-lg font-bold text-concrete-100">
            Próximo vencimiento
          </h2>
          {suscripcionActiva ? (
            <p className="mt-3 font-display text-2xl font-bold text-concrete-100">
              {formatFecha(suscripcionActiva.fechaFin)}
            </p>
          ) : (
            <EmptyState mensaje="No hay un vencimiento próximo." />
          )}
        </section>

        <section aria-labelledby="asistencias-semana">
          <AsistenciasSemanaCard rol={rol === "ENTRENADOR" ? "ENTRENADOR" : "CLIENTE"} />
        </section>
      </div>

      <section className={`${cardDark} mt-8 flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <h2 className="font-display text-lg font-bold text-concrete-100">¿Quieres revisar tu historial?</h2>
          <p className="mt-1 text-sm text-concrete-300">Consulta tus suscripciones y fechas registradas.</p>
        </div>
        <Link href="/dashboard/suscripciones" className={buttonSecondaryDark}>
          Ver mis suscripciones
        </Link>
      </section>

      {rol === "CLIENTE" && (
        <div className="mt-8">
          <MiCarnet />
        </div>
      )}
    </>
  );
}
