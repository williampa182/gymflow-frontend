"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { hasRole } from "@/lib/auth";
import { PlanRequestDTO, PlanResponseDTO, TipoPlan } from "@/types";
import axios from "axios";
import {
  card,
  input,
  label as labelClass,
  buttonPrimary,
  buttonSecondary,
  errorBanner,
  badgeEstado,
} from "@/lib/ui";

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
      // El backend devuelve Page<PlanResponseDTO> desde que se agregó
      // paginación (3.3) — el array real está en .content, no en la raíz.
      const res = await api.get<{ content: PlanResponseDTO[] }>("/planes");
      setPlanes(res.data.content);
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

  if (loading) return <p className="font-mono text-sm text-ink-500">Cargando planes...</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink-900">Planes</h1>
        {esAdmin && (
          <button onClick={abrirCrear} className={buttonPrimary}>
            + Nuevo plan
          </button>
        )}
      </div>

      {error && <p className={`mb-4 ${errorBanner}`}>{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {planes.map((plan) => (
          <div key={plan.id} className={`flex flex-col ${card}`}>
            <div className="mb-2 flex items-start justify-between">
              <h2 className="font-display text-lg font-bold text-ink-900">{plan.nombre}</h2>
              <span className={badgeEstado(plan.activo ? "moss" : "neutral")}>
                {plan.activo ? "Activo" : "Inactivo"}
              </span>
            </div>

            {plan.descripcion && (
              <p className="mb-3 text-sm text-ink-500">{plan.descripcion}</p>
            )}

            <p className="mb-1 font-display text-3xl font-bold text-ink-900">
              ${plan.precio.toLocaleString("es-CO")}
            </p>
            <p className="mb-3 font-mono text-xs text-ink-500">
              {plan.tipo} · {plan.duracionDias} días
            </p>

            <ul className="mb-4 space-y-1 text-sm text-ink-700">
              {plan.incluyeClases && (
                <li>✓ Incluye clases{plan.limiteClases ? ` (máx. ${plan.limiteClases})` : ""}</li>
              )}
              {plan.incluyeEntrenadorPersonal && <li>✓ Entrenador personal</li>}
            </ul>

            {esAdmin && (
              <div className="mt-auto flex gap-2 pt-2">
                <button onClick={() => abrirEditar(plan)} className={`flex-1 ${buttonSecondary}`}>
                  Editar
                </button>
                <button
                  onClick={() => cambiarEstado(plan)}
                  className={`flex-1 ${buttonSecondary}`}
                >
                  {plan.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {planes.length === 0 && !error && (
        <p className="font-mono text-sm text-ink-500">No hay planes registrados todavía.</p>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div className="w-full max-w-md rounded-lg border border-concrete-300 bg-concrete-50 p-6 shadow-xl">
            <h2 className="mb-4 font-display text-2xl font-bold text-ink-900">
              {editandoId ? "Editar plan" : "Nuevo plan"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>Nombre</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className={input}
                />
              </div>

              <div>
                <label className={labelClass}>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className={input}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Precio</label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                    className={input}
                  />
                </div>
                <div>
                  <label className={labelClass}>Duración (días)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.duracionDias}
                    onChange={(e) => setForm({ ...form, duracionDias: Number(e.target.value) })}
                    className={input}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoPlan })}
                  className={input}
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
                  className="h-4 w-4 rounded border-concrete-300 accent-hazard-500"
                />
                <label htmlFor="incluyeClases" className="text-sm text-ink-700">
                  Incluye clases
                </label>
              </div>

              {form.incluyeClases && (
                <div>
                  <label className={labelClass}>Límite de clases</label>
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
                    className={input}
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
                  className="h-4 w-4 rounded border-concrete-300 accent-hazard-500"
                />
                <label htmlFor="incluyeEntrenador" className="text-sm text-ink-700">
                  Incluye entrenador personal
                </label>
              </div>

              {formError && <p className={errorBanner}>{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={cerrarForm} className={`flex-1 ${buttonSecondary}`}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className={`flex-1 ${buttonPrimary}`}>
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
