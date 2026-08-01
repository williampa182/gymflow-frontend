"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {
  EstadoSuscripcion,
  PlanResponseDTO,
  SuscripcionRequestDTO,
  SuscripcionResponseDTO,
  UsuarioResponseDTO,
} from "@/types";
import axios from "axios";
import { Select } from "@/components/Select";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useToast } from "@/lib/toast";
import { useRequireRole } from "@/lib/useRequireRole";
import { usePageTitle } from "@/lib/usePageTitle";
import { formatFecha, formatMoneda } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonFilas } from "@/components/Skeleton";
import {
  input,
  label as labelClass,
  buttonPrimary,
  buttonSecondary,
  buttonDanger,
  errorBanner,
  badgeEstado,
  tableWrap,
  tableHead,
  tableHeadCell,
  tableRowDivide,
  modalPanel,
  modalBody,
} from "@/lib/ui";

const ESTADOS: EstadoSuscripcion[] = ["ACTIVA", "VENCIDA", "CANCELADA"];

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

export default function SuscripcionesPage() {
  usePageTitle("Suscripciones");
  const { notificar } = useToast();
  const autorizado = useRequireRole("ADMIN");

  const [suscripciones, setSuscripciones] = useState<SuscripcionResponseDTO[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoSuscripcion | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const confirmarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El focus trap vive en el modal de creación — mismo patrón que planes.
  const modalRef = useFocusTrap(mostrarForm, cerrarForm);

  // El timeout evita que el botón quede pegado en "¿Seguro?" para siempre.
  useEffect(() => {
    return () => {
      if (confirmarTimeoutRef.current) clearTimeout(confirmarTimeoutRef.current);
    };
  }, []);

  function pedirConfirmacion(id: number) {
    setConfirmandoId(id);
    if (confirmarTimeoutRef.current) clearTimeout(confirmarTimeoutRef.current);
    confirmarTimeoutRef.current = setTimeout(() => setConfirmandoId(null), 4000);
  }

  async function cargarSuscripciones() {
    setLoading(true);
    setError(null);
    try {
      // El backend devuelve Page<SuscripcionResponseDTO> desde la paginación (3.3).
      const res = await api.get<{ content: SuscripcionResponseDTO[] }>("/suscripciones", {
        params: filtroEstado ? { estado: filtroEstado } : {},
      });
      setSuscripciones(res.data.content);
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

    try {
      // Ambos endpoints devuelven Page<T> desde la paginación (3.3).
      const [usuariosRes, planesRes] = await Promise.all([
        api.get<{ content: UsuarioResponseDTO[] }>("/usuarios"),
        api.get<{ content: PlanResponseDTO[] }>("/planes", { params: { activo: true } }),
      ]);
      setUsuarios(usuariosRes.data.content);
      setPlanes(planesRes.data.content);
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
      notificar("exito", "Suscripción creada.");
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
      notificar("exito", "Suscripción cancelada.");
      await cargarSuscripciones();
    } catch (err) {
      console.error(err);
      setError("No se pudo cancelar la suscripción.");
    } finally {
      setCancelandoId(null);
      setConfirmandoId(null);
    }
  }

  const estadoVariante: Record<EstadoSuscripcion, "moss" | "hazard" | "neutral"> = {
    ACTIVA: "moss",
    VENCIDA: "hazard",
    CANCELADA: "neutral",
  };

  if (!autorizado) {
    return <p className="font-mono text-sm text-ink-500">Verificando acceso...</p>;
  }

  return (
    <div>
      <PageHeader
        titulo="Suscripciones"
        acciones={
          <>
            <Select
              value={filtroEstado}
              onChange={(v) => setFiltroEstado(v as EstadoSuscripcion | "")}
              options={ESTADOS.map((e) => ({ value: e, label: e }))}
              placeholder="Todos los estados"
              ariaLabel="Filtrar por estado"
              className="w-auto"
            />
            <button onClick={abrirCrear} className={buttonPrimary}>
              + Nueva suscripción
            </button>
          </>
        }
      />

      {error && <p className={`mb-4 ${errorBanner}`}>{error}</p>}

      {loading ? (
        <div className={tableWrap}>
          <SkeletonFilas filas={5} />
        </div>
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className={tableHeadCell}>Usuario</th>
                <th className={tableHeadCell}>Plan</th>
                <th className={tableHeadCell}>Inicio</th>
                <th className={tableHeadCell}>Fin</th>
                <th className={tableHeadCell}>Estado</th>
                <th className={tableHeadCell}></th>
              </tr>
            </thead>
            <tbody className={tableRowDivide}>
              {suscripciones.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-concrete-100/70">
                  <td className="px-4 py-3 text-ink-900">{s.nombreUsuario}</td>
                  <td className="px-4 py-3 text-ink-700">{s.nombrePlan}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {formatFecha(s.fechaInicio)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {formatFecha(s.fechaFin)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={badgeEstado(estadoVariante[s.estado])}>{s.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.estado === "ACTIVA" && (
                      <button
                        onClick={() =>
                          confirmandoId === s.id
                            ? cancelar(s.id)
                            : pedirConfirmacion(s.id)
                        }
                        disabled={cancelandoId === s.id}
                        className={
                          confirmandoId === s.id
                            ? "rounded-md bg-rust-600 px-3 py-1 text-xs font-medium text-concrete-50 transition hover:bg-rust-700 disabled:cursor-not-allowed disabled:opacity-50"
                            : buttonDanger
                        }
                      >
                        {cancelandoId === s.id
                          ? "..."
                          : confirmandoId === s.id
                            ? "¿Seguro?"
                            : "Cancelar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {suscripciones.length === 0 && (
            <EmptyState
              mensaje="No hay suscripciones con ese filtro."
              variante={filtroEstado ? "sinResultados" : "sinDatos"}
            />
          )}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Nueva suscripción"
            className={modalPanel}
          >
            <span className="rivet-light left-3 top-3" />
            <span className="rivet-light right-3 top-3" />
            <span className="rivet-light bottom-3 left-3" />
            <span className="rivet-light bottom-3 right-3" />
            <div className="hazard-stripe h-1" />

            <div className={modalBody}>
            <h2 className="mb-4 font-display text-2xl font-bold text-ink-900">
              Nueva suscripción
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>Usuario</label>
                <Select
                  value={String(form.usuarioId || "")}
                  onChange={(v) => setForm({ ...form, usuarioId: Number(v) })}
                  options={usuarios.map((u) => ({
                    value: String(u.id),
                    label: `${u.nombre} (${u.email}) · ${u.rol}`,
                  }))}
                  placeholder="Selecciona un usuario"
                  ariaLabel="Usuario"
                />
                {usuarios.length === 0 && (
                  <p className="mt-1 font-mono text-xs text-ink-500">
                    No hay usuarios registrados.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Plan</label>
                <Select
                  value={String(form.planId || "")}
                  onChange={(v) => setForm({ ...form, planId: Number(v) })}
                  options={planes.map((p) => ({
                    value: String(p.id),
                    label: `${p.nombre} — ${formatMoneda(p.precio)} (${p.duracionDias} días)`,
                  }))}
                  placeholder="Selecciona un plan"
                  ariaLabel="Plan"
                />
              </div>

              <div>
                <label className={labelClass}>Fecha de inicio</label>
                <input
                  type="date"
                  required
                  value={form.fechaInicio}
                  onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                  className={input}
                />
              </div>

              {formError && <p className={errorBanner}>{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={cerrarForm} className={`flex-1 ${buttonSecondary}`}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className={`flex-1 ${buttonPrimary}`}>
                  {guardando ? "Guardando..." : "Crear"}
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
