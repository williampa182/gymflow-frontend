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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink-900">Suscripciones</h1>
        <div className="flex gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoSuscripcion | "")}
            className={`${input} w-auto`}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <button onClick={abrirCrear} className={buttonPrimary}>
            + Nueva suscripción
          </button>
        </div>
      </div>

      {error && <p className={`mb-4 ${errorBanner}`}>{error}</p>}

      {loading ? (
        <p className="font-mono text-sm text-ink-500">Cargando suscripciones...</p>
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
                    {new Date(s.fechaInicio).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {new Date(s.fechaFin).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={badgeEstado(estadoVariante[s.estado])}>{s.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.estado === "ACTIVA" && (
                      <button
                        onClick={() => cancelar(s.id)}
                        disabled={cancelandoId === s.id}
                        className={buttonDanger}
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
            <p className="px-4 py-6 text-center font-mono text-sm text-ink-500">
              No hay suscripciones con ese filtro.
            </p>
          )}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div className={modalPanel}>
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
                <select
                  required
                  value={form.usuarioId || ""}
                  onChange={(e) => setForm({ ...form, usuarioId: Number(e.target.value) })}
                  className={input}
                >
                  <option value="">Selecciona un usuario</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.email}) · {u.rol}
                    </option>
                  ))}
                </select>
                {usuarios.length === 0 && (
                  <p className="mt-1 font-mono text-xs text-ink-500">
                    No hay usuarios registrados.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Plan</label>
                <select
                  required
                  value={form.planId || ""}
                  onChange={(e) => setForm({ ...form, planId: Number(e.target.value) })}
                  className={input}
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
