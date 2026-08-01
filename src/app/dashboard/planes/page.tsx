"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { hasRole } from "@/lib/auth";
import { PlanRequestDTO, PlanResponseDTO, TipoPlan } from "@/types";
import axios from "axios";
import { Select } from "@/components/Select";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useToast } from "@/lib/toast";
import { usePageTitle } from "@/lib/usePageTitle";
import { formatMoneda } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonTarjetas } from "@/components/Skeleton";
import {
  card,
  input,
  label as labelClass,
  buttonPrimary,
  buttonSecondary,
  errorBanner,
  badgeEstado,
  modalPanel,
  modalBody,
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
  usePageTitle("Planes");
  const esAdmin = hasRole("ADMIN");
  const { notificar } = useToast();

  const [planes, setPlanes] = useState<PlanResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PlanRequestDTO>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const modalRef = useFocusTrap(mostrarForm, cerrarForm);

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
      notificar("exito", editandoId ? "Plan actualizado." : "Plan creado.");
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
    setCambiandoId(plan.id);
    try {
      await api.patch(`/planes/${plan.id}/estado`, null, {
        params: { activo: !plan.activo },
      });
      notificar("exito", plan.activo ? "Plan desactivado." : "Plan activado.");
      await cargarPlanes();
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado del plan.");
    } finally {
      setCambiandoId(null);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader titulo="Planes" />
        <SkeletonTarjetas />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Planes"
        acciones={
          esAdmin && (
            <button onClick={abrirCrear} className={buttonPrimary}>
              + Nuevo plan
            </button>
          )
        }
      />

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
              {formatMoneda(plan.precio)}
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
                  disabled={cambiandoId === plan.id}
                  className={`flex-1 ${buttonSecondary}`}
                >
                  {cambiandoId === plan.id ? "..." : plan.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {planes.length === 0 && !error && <EmptyState mensaje="No hay planes registrados todavía." />}

      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={editandoId ? "Editar plan" : "Nuevo plan"}
            className={modalPanel}
          >
            <span className="rivet-light left-3 top-3" />
            <span className="rivet-light right-3 top-3" />
            <span className="rivet-light bottom-3 left-3" />
            <span className="rivet-light bottom-3 right-3" />
            <div className="hazard-stripe h-1" />

            <div className={modalBody}>
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
                <Select
                  value={form.tipo}
                  onChange={(v) => setForm({ ...form, tipo: v as TipoPlan })}
                  options={TIPOS.map((t) => ({ value: t, label: t }))}
                  placeholder="Selecciona un tipo"
                  ariaLabel="Tipo"
                />
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
        </div>
      )}
    </div>
  );
}
