"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { hasRole } from "@/lib/auth";
import {
  EstadoSuscripcion,
  PlanResponseDTO,
  SuscripcionRequestDTO,
  SuscripcionResponseDTO,
  UsuarioResponseDTO,
} from "@/types";
import axios from "axios";

const ESTADOS: EstadoSuscripcion[] = ["ACTIVA", "VENCIDA", "CANCELADA"];

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

export default function SuscripcionesPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    if (!hasRole("ADMIN")) {
      router.replace("/dashboard");
      return;
    }
    setAutorizado(true);
  }, [router]);

  const [suscripciones, setSuscripciones] = useState<SuscripcionResponseDTO[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoSuscripcion | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos para el formulario de creación
  const [usuarios, setUsuarios] = useState<UsuarioResponseDTO[]>([]);
  const [planes, setPlanes] = useState<PlanResponseDTO[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<SuscripcionRequestDTO>({
    usuarioId: 0,
    planId: 0,
    fechaInicio: hoyISO(),
  });
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Acción de cancelar
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  async function cargarSuscripciones() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<SuscripcionResponseDTO[]>("/suscripciones", {
        params: filtroEstado ? { estado: filtroEstado } : {},
      });
      setSuscripciones(res.data);
    } catch (err) {
      setError("No se pudieron cargar las suscripciones.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autorizado) cargarSuscripciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, autorizado]);

  async function abrirCrear() {
    setFormError(null);
    setForm({ usuarioId: 0, planId: 0, fechaInicio: hoyISO() });
    setMostrarForm(true);

    // Cargar todos los usuarios (cualquier rol puede tener una suscripción) y planes activos
    try {
      const [usuariosRes, planesRes] = await Promise.all([
        api.get<UsuarioResponseDTO[]>("/usuarios"),
        api.get<PlanResponseDTO[]>("/planes", { params: { activo: true } }),
      ]);
      setUsuarios(usuariosRes.data);
      setPlanes(planesRes.data);
    } catch (err) {
      console.error(err);
      setFormError("No se pudieron cargar usuarios/planes para el formulario.");
    }
  }

  function cerrarForm() {
    setMostrarForm(false);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.usuarioId || !form.planId) {
      setFormError("Selecciona un usuario y un plan.");
      return;
    }

    setGuardando(true);
    setFormError(null);

    try {
      await api.post("/suscripciones", form);
      cerrarForm();
      await cargarSuscripciones();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const data = err.response.data as { message?: string };
        setFormError(data.message ?? "No se pudo crear la suscripción.");
      } else {
        setFormError("No se pudo crear la suscripción.");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function cancelar(id: number) {
    setCancelandoId(id);
    try {
      await api.patch(`/suscripciones/${id}/cancelar`);
      await cargarSuscripciones();
    } catch (err) {
      console.error(err);
      setError("No se pudo cancelar la suscripción.");
    } finally {
      setCancelandoId(null);
    }
  }

  const estadoBadge: Record<EstadoSuscripcion, string> = {
    ACTIVA: "bg-green-100 text-green-700",
    VENCIDA: "bg-yellow-100 text-yellow-700",
    CANCELADA: "bg-gray-100 text-gray-500",
  };

  if (!autorizado) {
    return <p className="text-sm text-gray-500">Verificando acceso...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Suscripciones</h1>
        <div className="flex gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoSuscripcion | "")}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <button
            onClick={abrirCrear}
            className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Nueva suscripción
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando suscripciones...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Inicio</th>
                <th className="px-4 py-3 font-medium">Fin</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suscripciones.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-gray-900">{s.nombreUsuario}</td>
                  <td className="px-4 py-3 text-gray-600">{s.nombrePlan}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(s.fechaInicio).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(s.fechaFin).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadge[s.estado]}`}
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.estado === "ACTIVA" && (
                      <button
                        onClick={() => cancelar(s.id)}
                        disabled={cancelandoId === s.id}
                        className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        {cancelandoId === s.id ? "..." : "Cancelar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {suscripciones.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              No hay suscripciones con ese filtro.
            </p>
          )}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Nueva suscripción</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Usuario</label>
                <select
                  required
                  value={form.usuarioId || ""}
                  onChange={(e) => setForm({ ...form, usuarioId: Number(e.target.value) })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Selecciona un usuario</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.email}) · {u.rol}
                    </option>
                  ))}
                </select>
                {usuarios.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    No hay usuarios registrados.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Plan</label>
                <select
                  required
                  value={form.planId || ""}
                  onChange={(e) => setForm({ ...form, planId: Number(e.target.value) })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Selecciona un plan</option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — ${p.precio.toLocaleString("es-CO")} ({p.duracionDias} días)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  required
                  value={form.fechaInicio}
                  onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              {formError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarForm}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
