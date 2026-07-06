"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { hasRole } from "@/lib/auth";
import { PlanRequestDTO, PlanResponseDTO, TipoPlan } from "@/types";
import axios from "axios";

const TIPOS: TipoPlan[] = ["MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];

const FORM_VACIO: PlanRequestDTO = {
  nombre: "",
  descripcion: "",
  precio: 0,
  duracionDias: 30,
  tipo: "MENSUAL",
  limiteClases: undefined,
  incluyeClases: false,
  incluyeEntrenadorPersonal: false,
};

export default function PlanesPage() {
  const esAdmin = hasRole("ADMIN");

  const [planes, setPlanes] = useState<PlanResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PlanRequestDTO>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function cargarPlanes() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PlanResponseDTO[]>("/planes");
      setPlanes(res.data);
    } catch (err) {
      setError("No se pudieron cargar los planes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPlanes();
  }, []);

  function abrirCrear() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setMostrarForm(true);
  }

  function abrirEditar(plan: PlanResponseDTO) {
    setEditandoId(plan.id);
    setForm({
      nombre: plan.nombre,
      descripcion: plan.descripcion ?? "",
      precio: plan.precio,
      duracionDias: plan.duracionDias,
      tipo: plan.tipo,
      limiteClases: plan.limiteClases ?? undefined,
      incluyeClases: plan.incluyeClases,
      incluyeEntrenadorPersonal: plan.incluyeEntrenadorPersonal,
    });
    setFormError(null);
    setMostrarForm(true);
  }

  function cerrarForm() {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(FORM_VACIO);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);

    try {
      if (editandoId) {
        await api.put(`/planes/${editandoId}`, form);
      } else {
        await api.post("/planes", form);
      }
      cerrarForm();
      await cargarPlanes();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const data = err.response.data as { message?: string };
        setFormError(data.message ?? "No se pudo guardar el plan.");
      } else {
        setFormError("No se pudo guardar el plan.");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(plan: PlanResponseDTO) {
    try {
      await api.patch(`/planes/${plan.id}/estado`, null, {
        params: { activo: !plan.activo },
      });
      await cargarPlanes();
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado del plan.");
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando planes...</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Planes</h1>
        {esAdmin && (
          <button
            onClick={abrirCrear}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Nuevo plan
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {planes.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="mb-2 flex items-start justify-between">
              <h2 className="font-semibold text-gray-900">{plan.nombre}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  plan.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {plan.activo ? "Activo" : "Inactivo"}
              </span>
            </div>

            {plan.descripcion && (
              <p className="mb-3 text-sm text-gray-500">{plan.descripcion}</p>
            )}

            <p className="mb-1 text-2xl font-semibold text-gray-900">
              ${plan.precio.toLocaleString("es-CO")}
            </p>
            <p className="mb-3 text-sm text-gray-500">
              {plan.tipo} · {plan.duracionDias} días
            </p>

            <ul className="mb-4 space-y-1 text-sm text-gray-600">
              {plan.incluyeClases && (
                <li>✓ Incluye clases{plan.limiteClases ? ` (máx. ${plan.limiteClases})` : ""}</li>
              )}
              {plan.incluyeEntrenadorPersonal && <li>✓ Entrenador personal</li>}
            </ul>

            {esAdmin && (
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  onClick={() => abrirEditar(plan)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => cambiarEstado(plan)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  {plan.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {planes.length === 0 && !error && (
        <p className="text-sm text-gray-500">No hay planes registrados todavía.</p>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editandoId ? "Editar plan" : "Nuevo plan"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Precio</label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Duración (días)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.duracionDias}
                    onChange={(e) => setForm({ ...form, duracionDias: Number(e.target.value) })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoPlan })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="incluyeClases"
                  type="checkbox"
                  checked={form.incluyeClases}
                  onChange={(e) => setForm({ ...form, incluyeClases: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="incluyeClases" className="text-sm text-gray-700">
                  Incluye clases
                </label>
              </div>

              {form.incluyeClases && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Límite de clases
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.limiteClases ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        limiteClases: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  id="incluyeEntrenador"
                  type="checkbox"
                  checked={form.incluyeEntrenadorPersonal}
                  onChange={(e) =>
                    setForm({ ...form, incluyeEntrenadorPersonal: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="incluyeEntrenador" className="text-sm text-gray-700">
                  Incluye entrenador personal
                </label>
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
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
