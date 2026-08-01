"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { card } from "@/lib/ui";
import { formatMoneda } from "@/lib/format";
import type {
  Rol,
  TipoPlan,
  EstadoSuscripcion,
  DashboardAdminStatsDTO,
} from "@/types";

// ─── Paleta "sala de máquinas" ────────────────────────────────────
// Recharts no acepta clases Tailwind: necesita hex. Tomados de globals.css.
const PALETA = {
  hazard500: "#e0a012",
  moss600: "#3f7a57",
  rust600: "#b23a24",
  ink900: "#1c1d20",
  ink700: "#35363b",
  ink500: "#6b6c70",
  concrete300: "#c2bcae",
  concrete50: "#f7f6f3",
} as const;

// Asignación semántica consistente con badgeEstado() de ui.ts.
const colorPorRol: Record<Rol, string> = {
  ADMIN: PALETA.hazard500,
  ENTRENADOR: PALETA.moss600,
  CLIENTE: PALETA.ink700,
};

const colorPorEstado: Record<EstadoSuscripcion, string> = {
  ACTIVA: PALETA.moss600,
  VENCIDA: PALETA.hazard500,
  CANCELADA: PALETA.rust600,
};

const ordenTipoPlan: TipoPlan[] = ["MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];
const ordenRol: Rol[] = ["ADMIN", "ENTRENADOR", "CLIENTE"];
const ordenEstado: EstadoSuscripcion[] = ["ACTIVA", "VENCIDA", "CANCELADA"];

// ─── Tooltip custom (respeta la paleta) ───────────────────────────
function ChartTooltip({
  active,
  payload,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: { nombre?: string };
  }>;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  const valor = p.value ?? 0;
  return (
    <div className="rounded-md border border-concrete-300 bg-concrete-50 px-3 py-2 shadow-sm">
      <p className="font-mono text-xs text-ink-900">
        {p.payload?.nombre ?? p.name}: {formatter ? formatter(valor) : valor}
      </p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────
// Presentacional: recibe los stats por prop desde dashboard/page.tsx,
// que ya los carga con un único fetch a /dashboard/admin/estadisticas.
export default function AdminDashboardCharts({
  stats,
}: {
  stats: DashboardAdminStatsDTO;
}) {
  // ── Normalización: ordeno por el orden canónico de los enums ──
  const dataRol = ordenRol.map((rol) => {
    const d = stats.usuariosPorRol.find((x) => x.rol === rol);
    return { nombre: rol, value: d?.cantidad ?? 0, color: colorPorRol[rol] };
  });
  const totalUsuarios = dataRol.reduce((a, b) => a + b.value, 0);

  const dataEstado = ordenEstado.map((estado) => {
    const d = stats.suscripcionesPorEstado.find((x) => x.estado === estado);
    return {
      nombre: estado,
      value: d?.cantidad ?? 0,
      color: colorPorEstado[estado],
    };
  });
  const totalSuscripciones = dataEstado.reduce((a, b) => a + b.value, 0);

  const dataIngresos = ordenTipoPlan
    .map((tipo) => {
      const e = stats.ingresosPorTipoPlan.find((x) => x.tipoPlan === tipo);
      return {
        nombre: tipo,
        ingreso: e?.ingresoEstimado ?? 0,
        cantidad: e?.cantidadSuscripciones ?? 0,
      };
    })
    .filter((d) => d.cantidad > 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── Donut: usuarios por rol ── */}
      <section
        className={`${card} flex flex-col`}
        role="img"
        aria-label={`Usuarios activos por rol: ${dataRol
          .map((d) => `${d.nombre} ${d.value}`)
          .join(", ")}`}
      >
        <header className="mb-4">
          <h2 className="font-display text-lg font-bold text-ink-900">
            Usuarios activos por rol
          </h2>
          <p className="font-mono text-[11px] text-ink-500">
            Total: {totalUsuarios}
          </p>
        </header>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataRol}
                dataKey="value"
                nameKey="nombre"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                stroke={PALETA.concrete50}
                strokeWidth={2}
              >
                {dataRol.map((d) => (
                  <Cell key={d.nombre} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <LeyendaCategorias items={dataRol} total={totalUsuarios} />
      </section>

      {/* ── Donut: suscripciones por estado ── */}
      <section
        className={`${card} flex flex-col`}
        role="img"
        aria-label={`Suscripciones por estado: ${dataEstado
          .map((d) => `${d.nombre} ${d.value}`)
          .join(", ")}`}
      >
        <header className="mb-4">
          <h2 className="font-display text-lg font-bold text-ink-900">
            Suscripciones por estado
          </h2>
          <p className="font-mono text-[11px] text-ink-500">
            Total: {totalSuscripciones}
          </p>
        </header>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataEstado}
                dataKey="value"
                nameKey="nombre"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                stroke={PALETA.concrete50}
                strokeWidth={2}
              >
                {dataEstado.map((d) => (
                  <Cell key={d.nombre} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <LeyendaCategorias items={dataEstado} total={totalSuscripciones} />
      </section>

      {/* ── Barras: ingresos por tipo de plan ── */}
      <section
        className={`${card} lg:col-span-2 flex flex-col`}
        role="img"
        aria-label={`Ingresos estimados por tipo de plan: ${dataIngresos
          .map((d) => `${d.nombre} ${formatMoneda(d.ingreso)}`)
          .join(", ")}`}
      >
        <header className="mb-4">
          <h2 className="font-display text-lg font-bold text-ink-900">
            Ingresos estimados por tipo de plan
          </h2>
          <p className="font-mono text-[11px] text-ink-500">
            Suma de precios de suscripciones activas, por tipo de plan
          </p>
        </header>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataIngresos}
              margin={{ top: 16, right: 16, left: 8, bottom: 0 }}
            >
              <XAxis
                dataKey="nombre"
                tick={{
                  fill: PALETA.ink500,
                  fontSize: 12,
                  fontFamily: "JetBrains Mono, monospace",
                }}
                axisLine={{ stroke: PALETA.concrete300 }}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: PALETA.ink500,
                  fontSize: 11,
                  fontFamily: "JetBrains Mono, monospace",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  formatMoneda(Number(v)).replace(/\s?\w+$/, "")
                }
                width={70}
              />
              <Tooltip
                cursor={{ fill: PALETA.concrete300, opacity: 0.25 }}
                content={<ChartTooltip formatter={formatMoneda} />}
              />
              <Bar dataKey="ingreso" radius={[4, 4, 0, 0]} maxBarSize={90}>
                {dataIngresos.map((d) => (
                  <Cell key={d.nombre} fill={PALETA.hazard500} />
                ))}
                <LabelList
                  dataKey="ingreso"
                  position="top"
                  formatter={(v) => formatMoneda(Number(v))}
                  style={{
                    fill: PALETA.ink900,
                    fontSize: 11,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// ─── Helpers de presentación ──────────────────────────────────────

function LeyendaCategorias({
  items,
  total,
}: {
  items: Array<{ nombre: string; value: number; color: string }>;
  total: number;
}) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <li key={d.nombre} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="font-mono text-xs text-ink-700">
              {d.nombre} · {d.value} ({pct}%)
            </span>
          </li>
        );
      })}
    </ul>
  );
}
