"use client";


import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import type { PlanRequestDTO, PlanResponseDTO, Rol, TipoPlan } from "@/types";
import { Select } from "@/components/Select";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonFilas } from "@/components/Skeleton";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { usePageTitle } from "@/lib/usePageTitle";
import { useRequireRole } from "@/lib/useRequireRole";
import { useToast } from "@/lib/toast";
import { formatMoneda } from "@/lib/format";
import {
  badgeEstado,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  errorBanner,
  input,
  label as labelClass,
  modalBody,
  modalPanel,
  tableHead,
  tableHeadCell,
  tableRowDivide,
  tableWrap,
} from "@/lib/ui";


const TIPOS: TipoPlan[] = ["MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];
const ROLES_PERMITIDOS: Rol[] = ["ADMIN", "CLIENTE", "ENTRENADOR"];


type PageResponse<T> = { content: T[] };
type PlanField = "nombre" | "precio" | "duracionDias" | "tipo";
type PlanErrors = Partial<Record<PlanField, string>>;


function formularioVacio(): PlanRequestDTO {
  return {
    nombre: "",
    descripcion: "",
    precio: 0,
    duracionDias: 30,
    tipo: "MENSUAL",
    limiteClases: undefined,
    incluyeClases: false,
    incluyeEntrenadorPersonal: false,
  };
}


function mensajeDeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string };
    return data.message ?? fallback;
  }
  return fallback;
}


export default function PlanesPage() {
  const rol = getRol() ?? "CLIENTE";
  const esAdmin = rol === "ADMIN";
  const titulo = esAdmin ? "Planes" : "Planes disponibles";
  const subtitulo = esAdmin
    ? "Oferta comercial de membresías"
    : "Elige el plan que mejor se adapte a tu entrenamiento";
  usePageTitle(titulo);
  const autorizado = useRequireRole(ROLES_PERMITIDOS, "/dashboard");
  const { notificar } = useToast();


  const [planes, setPlanes] = useState<PlanResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const confirmarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<PlanRequestDTO>(formularioVacio());
  const [formErrors, setFormErrors] = useState<PlanErrors>({});
  const [guardando, setGuardando] = useState(false);


  function cerrarForm() {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(formularioVacio());
    setFormErrors({});
  }


  const modalRef = useFocusTrap(mostrarForm, cerrarForm);


  useEffect(() => {
    return () => {
      if (confirmarTimeoutRef.current) clearTimeout(confirmarTimeoutRef.current);
    };
  }, []);


  async function cargarPlanes() {
    setLoading(true);
    setError(null);
    try {
      const response = esAdmin
        ? await api.get<PageResponse<PlanResponseDTO>>("/planes")
        : await api.get<PageResponse<PlanResponseDTO>>("/planes", {
            params: { activo: true },
          });
      setPlanes(response.data.content);
    } catch (err) {
      setError("No se pudieron cargar los planes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (autorizado) void cargarPlanes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizado, esAdmin]);


  function abrirCrear() {
    setEditandoId(null);
    setForm(formularioVacio());
    setFormErrors({});
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
      limiteClases: plan.limiteClases || undefined,
      incluyeClases: plan.incluyeClases,
      incluyeEntrenadorPersonal: plan.incluyeEntrenadorPersonal,
    });
    setFormErrors({});
    setMostrarForm(true);
  }


  function validarFormulario(): boolean {
    const errores: PlanErrors = {};
    if (!form.nombre.trim()) errores.nombre = "Completa el nombre del plan.";
    if (!Number.isFinite(form.precio) || form.precio <= 0) {
      errores.precio = "Ingresa un precio mayor a $ 0.";
    }
    if (!Number.isInteger(form.duracionDias) || form.duracionDias < 1) {
      errores.duracionDias = "La duración debe ser de al menos 1 día.";
    }
    if (!form.tipo) errores.tipo = "Selecciona un tipo de plan.";
    setFormErrors(errores);
    return Object.keys(errores).length === 0;
  }


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validarFormulario()) return;


    setGuardando(true);
    try {
      if (editandoId !== null) {
        await api.put(`/planes/${editandoId}`, form);
        notificar("exito", "Plan actualizado.");
      } else {
        await api.post("/planes", form);
        notificar("exito", "Plan creado.");
      }
      cerrarForm();
      await cargarPlanes();
    } catch (err) {
      setFormErrors({ nombre: mensajeDeError(err, "No se pudo guardar el plan.") });
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
      setError("No se pudo cambiar el estado del plan.");
      console.error(err);
    } finally {
      setCambiandoId(null);
      setConfirmandoId(null);
    }
  }


  function pedirCambioEstado(plan: PlanResponseDTO) {
    if (!plan.activo) {
      void cambiarEstado(plan);
      return;
    }


    setConfirmandoId(plan.id);
    if (confirmarTimeoutRef.current) clearTimeout(confirmarTimeoutRef.current);
    confirmarTimeoutRef.current = setTimeout(() => setConfirmandoId(null), 4000);
  }


  if (!autorizado) {
    return <p className="font-mono text-sm text-ink-500">Verificando acceso...</p>;
  }


  if (loading) {
    return (
      <div>
        <PageHeader titulo={titulo} subtitulo={subtitulo} />
        <div className={tableWrap}>
          <SkeletonFilas filas={5} />
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return <PlanesDisponiblesView planes={planes} error={error} />;
  }


  return (
    <div>
      <PageHeader
        titulo={titulo}
        subtitulo={subtitulo}
        acciones={
          <button type="button" onClick={abrirCrear} className={buttonPrimary}>
            + Nuevo plan
          </button>
        }
      />


      {error && <p className={`mb-4 ${errorBanner}`}>{error}</p>}


      <div className={tableWrap}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className={tableHead}>
            <tr>
              <th className={tableHeadCell}>Nombre</th>
              <th className={tableHeadCell}>Precio</th>
              <th className={tableHeadCell}>Intervalo</th>
              <th className={tableHeadCell}>Activo</th>
              <th className={tableHeadCell}>Acciones</th>
            </tr>
          </thead>
          <tbody className={tableRowDivide}>
            {planes.map((plan) => {
              const pendiente = cambiandoId === plan.id;
              const confirmando = confirmandoId === plan.id;
              const actionLabel = pendiente
                ? "..."
                : confirmando
                  ? "¿Seguro?"
                  : plan.activo
                    ? "Desactivar"
                    : "Activar";


              return (
                <tr key={plan.id} className="transition-colors hover:bg-concrete-100/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{plan.nombre}</p>
                    {plan.descripcion && (
                      <p className="mt-1 text-xs text-ink-500">{plan.descripcion}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">
                    {formatMoneda(plan.precio)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={badgeEstado("neutral")}>
                      {plan.tipo} · {plan.duracionDias} días
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-pressed={plan.activo}
                      aria-label={`Cambiar estado de ${plan.nombre}`}
                      disabled={pendiente}
                      onClick={() => void cambiarEstado(plan)}
                      className={buttonSecondary}
                    >
                      {pendiente ? "..." : plan.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(plan)}
                        className={buttonSecondary}
                      >
                        Editar
                      </button>
                      {plan.activo && (
                        <button
                          type="button"
                          aria-label={actionLabel}
                          disabled={pendiente}
                          onClick={() => {
                            if (confirmando) void cambiarEstado(plan);
                            else pedirCambioEstado(plan);
                          }}
                          className={buttonDanger}
                        >
                          {actionLabel}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>


        {planes.length === 0 && (
          <EmptyState mensaje="No hay planes registrados todavía." variante="sinDatos" />
        )}
      </div>


      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-modal-title"
            className={modalPanel}
          >
            <span className="rivet-light left-3 top-3" />
            <span className="rivet-light right-3 top-3" />
            <span className="rivet-light bottom-3 left-3" />
            <span className="rivet-light bottom-3 right-3" />
            <div className="hazard-stripe h-1" />


            <div className={modalBody}>
              <h2 id="plan-modal-title" className="mb-4 font-display text-2xl font-bold text-ink-900">
                {editandoId !== null ? "Editar plan" : "Nuevo plan"}
              </h2>


              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div>
                  <label htmlFor="plan-nombre" className={labelClass}>Nombre</label>
                  <input
                    id="plan-nombre"
                    required
                    value={form.nombre}
                    aria-invalid={Boolean(formErrors.nombre)}
                    aria-describedby={formErrors.nombre ? "plan-nombre-error" : undefined}
                    onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                    className={input}
                  />
                  {formErrors.nombre && (
                    <p id="plan-nombre-error" className="mt-1 text-xs text-rust-700">
                      {formErrors.nombre}
                    </p>
                  )}
                </div>


                <div>
                  <label htmlFor="plan-descripcion" className={labelClass}>Descripción</label>
                  <textarea
                    id="plan-descripcion"
                    value={form.descripcion}
                    onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
                    className={input}
                    rows={2}
                  />
                </div>


                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="plan-precio" className={labelClass}>Precio</label>
                    <input
                      id="plan-precio"
                      type="number"
                      required
                      min={0.01}
                      step="0.01"
                      value={form.precio || ""}
                      aria-invalid={Boolean(formErrors.precio)}
                      aria-describedby={formErrors.precio ? "plan-precio-error" : undefined}
                      onChange={(event) => setForm({ ...form, precio: Number(event.target.value) })}
                      className={input}
                    />
                    {formErrors.precio && (
                      <p id="plan-precio-error" className="mt-1 text-xs text-rust-700">
                        {formErrors.precio}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="plan-duracion" className={labelClass}>Duración (días)</label>
                    <input
                      id="plan-duracion"
                      type="number"
                      required
                      min={1}
                      value={form.duracionDias}
                      aria-invalid={Boolean(formErrors.duracionDias)}
                      aria-describedby={formErrors.duracionDias ? "plan-duracion-error" : undefined}
                      onChange={(event) => setForm({ ...form, duracionDias: Number(event.target.value) })}
                      className={input}
                    />
                    {formErrors.duracionDias && (
                      <p id="plan-duracion-error" className="mt-1 text-xs text-rust-700">
                        {formErrors.duracionDias}
                      </p>
                    )}
                  </div>
                </div>


                <div>
                  <label className={labelClass}>Tipo</label>
                  <Select
                    value={form.tipo}
                    onChange={(value) => setForm({ ...form, tipo: value as TipoPlan })}
                    options={TIPOS.map((tipo) => ({ value: tipo, label: tipo }))}
                    placeholder="Selecciona un tipo"
                    ariaLabel="Tipo de plan"
                  />
                </div>


                <div className="flex items-center gap-2">
                  <input
                    id="plan-clases"
                    type="checkbox"
                    checked={form.incluyeClases}
                    onChange={(event) => setForm({ ...form, incluyeClases: event.target.checked })}
                    className="h-4 w-4 accent-hazard-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400"
                  />
                  <label htmlFor="plan-clases" className="text-sm text-ink-700">Incluye clases</label>
                </div>


                {form.incluyeClases && (
                  <div>
                    <label htmlFor="plan-limite" className={labelClass}>Límite de clases</label>
                    <input
                      id="plan-limite"
                      type="number"
                      min={1}
                      value={form.limiteClases ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          limiteClases: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                      className={input}
                    />
                  </div>
                )}


                <div className="flex items-center gap-2">
                  <input
                    id="plan-entrenador"
                    type="checkbox"
                    checked={form.incluyeEntrenadorPersonal}
                    onChange={(event) =>
                      setForm({ ...form, incluyeEntrenadorPersonal: event.target.checked })
                    }
                    className="h-4 w-4 accent-hazard-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400"
                  />
                  <label htmlFor="plan-entrenador" className="text-sm text-ink-700">
                    Incluye entrenador personal
                  </label>
                </div>


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

function PlanesDisponiblesView({
  planes,
  error,
}: {
  planes: PlanResponseDTO[];
  error: string | null;
}) {
  // Defensa extra: el backend ya fuerza activo=true para no-ADMIN
  // (PlanService.listar()), pero si el contrato cambia, acá nunca se
  // filtra un plan inactivo hacia un CLIENTE/ENTRENADOR.
  const planesActivos = planes.filter((plan) => plan.activo);

  return (
    <div>
      <PageHeader
        titulo="Planes disponibles"
        subtitulo="Elige el plan que mejor se adapte a tu entrenamiento"
      />
      {error && <p className={`mb-4 ${errorBanner}`}>{error}</p>}
      <div className={tableWrap}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className={tableHead}>
            <tr>
              <th className={tableHeadCell}>Nombre</th>
              <th className={tableHeadCell}>Precio</th>
              <th className={tableHeadCell}>Intervalo</th>
            </tr>
          </thead>
          <tbody className={tableRowDivide}>
            {planesActivos.map((plan) => (
              <tr key={plan.id} className="transition-colors hover:bg-concrete-100/70">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{plan.nombre}</p>
                  {plan.descripcion && (
                    <p className="mt-1 text-xs text-ink-500">{plan.descripcion}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-700">
                  {formatMoneda(plan.precio)}
                </td>
                <td className="px-4 py-3">
                  <span className={badgeEstado("neutral")}>
                    {plan.tipo} · {plan.duracionDias} días
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {planesActivos.length === 0 && (
          <EmptyState mensaje="No hay planes activos disponibles." variante="sinDatos" />
        )}
      </div>
    </div>
  );
}
