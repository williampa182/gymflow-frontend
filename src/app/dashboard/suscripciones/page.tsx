"use client";


import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import api from "@/lib/api";
import type {
  EstadoSuscripcion,
  PlanResponseDTO,
  Rol,
  SuscripcionRequestDTO,
  SuscripcionResponseDTO,
  UsuarioResponseDTO,
} from "@/types";
import { Select } from "@/components/Select";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonFilas } from "@/components/Skeleton";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { getRol } from "@/lib/auth";
import { usePageTitle } from "@/lib/usePageTitle";
import { useRequireRole } from "@/lib/useRequireRole";
import { useToast } from "@/lib/toast";
import { formatFecha, formatMoneda } from "@/lib/format";
import {
  badgeEstado,
  buttonDanger,
  buttonPrimary,
  buttonSecondaryDark,
  errorBannerDark,
  inputDark as input,
  labelDark as labelClass,
  modalBodyDark as modalBody,
  modalPanelDark as modalPanel,
  tableHeadDark as tableHead,
  tableHeadCell,
  tableRowDivideDark as tableRowDivide,
  tableWrapDark as tableWrap,
} from "@/lib/ui";


const ESTADOS: EstadoSuscripcion[] = ["ACTIVA", "VENCIDA", "CANCELADA"];
const ROLES_PERMITIDOS: Rol[] = ["ADMIN", "CLIENTE", "ENTRENADOR"];
type PageResponse<T> = { content: T[] };


function hoyISO(): string {
  return new Date().toISOString().split("T")[0];
}


function fechaFinEstimada(fechaInicio: string, duracionDias?: number): string {
  if (!fechaInicio || !duracionDias) return "";
  const fecha = new Date(`${fechaInicio}T00:00:00`);
  fecha.setDate(fecha.getDate() + duracionDias - 1);
  return fecha.toISOString().split("T")[0];
}


function mensajeDeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string };
    return data.message ?? fallback;
  }
  return fallback;
}


export default function SuscripcionesPage() {
  const rol = getRol() ?? "CLIENTE";
  const esAdmin = rol === "ADMIN";
  usePageTitle(esAdmin ? "Suscripciones" : "Mis suscripciones");
  const autorizado = useRequireRole(ROLES_PERMITIDOS, "/dashboard");
  const { notificar } = useToast();


  const [suscripciones, setSuscripciones] = useState<SuscripcionResponseDTO[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoSuscripcion | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [usuarios, setUsuarios] = useState<UsuarioResponseDTO[]>([]);
  const [planes, setPlanes] = useState<PlanResponseDTO[]>([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<SuscripcionRequestDTO>({
    usuarioId: 0,
    planId: 0,
    fechaInicio: hoyISO(),
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);


  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const confirmarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  function cerrarForm() {
    setMostrarForm(false);
    setFormError(null);
  }


  const modalRef = useFocusTrap(mostrarForm, cerrarForm);


  useEffect(() => {
    return () => {
      if (confirmarTimeoutRef.current) clearTimeout(confirmarTimeoutRef.current);
    };
  }, []);


  async function cargarSuscripciones() {
    setLoading(true);
    setError(null);
    try {
      const response = esAdmin
        ? await api.get<PageResponse<SuscripcionResponseDTO>>("/suscripciones", {
            params: filtroEstado ? { estado: filtroEstado } : {},
          })
        : await api.get<PageResponse<SuscripcionResponseDTO>>("/suscripciones/mis");
      setSuscripciones(response.data.content);
    } catch (err) {
      setError("No se pudieron cargar las suscripciones.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (autorizado) void cargarSuscripciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, autorizado, esAdmin]);


  async function abrirCrear() {
    setForm({ usuarioId: 0, planId: 0, fechaInicio: hoyISO() });
    setFormError(null);
    setMostrarForm(true);
    setCargandoOpciones(true);


    try {
      const [usuariosResponse, planesResponse] = await Promise.all([
        api.get<PageResponse<UsuarioResponseDTO>>("/usuarios"),
        api.get<PageResponse<PlanResponseDTO>>("/planes", { params: { activo: true } }),
      ]);
      setUsuarios(usuariosResponse.data.content);
      setPlanes(planesResponse.data.content.filter((plan) => plan.activo));
    } catch (err) {
      setFormError(mensajeDeError(err, "No se pudieron cargar usuarios y planes."));
    } finally {
      setCargandoOpciones(false);
    }
  }


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const plan = planes.find((item) => item.id === form.planId);
    const fechaFin = fechaFinEstimada(form.fechaInicio, plan?.duracionDias);


    if (!form.usuarioId || !plan?.activo) {
      setFormError("Selecciona un usuario y un plan activo.");
      return;
    }
    if (!form.fechaInicio || !fechaFin || fechaFin < form.fechaInicio) {
      setFormError("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
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
      setFormError(mensajeDeError(err, "No se pudo crear la suscripción."));
    } finally {
      setGuardando(false);
    }
  }


  async function cancelar(suscripcion: SuscripcionResponseDTO) {
    setCancelandoId(suscripcion.id);
    try {
      await api.patch(`/suscripciones/${suscripcion.id}/cancelar`);
      notificar("exito", "Suscripción cancelada.");
      await cargarSuscripciones();
    } catch (err) {
      setError("No se pudo cancelar la suscripción.");
      console.error(err);
    } finally {
      setCancelandoId(null);
      setConfirmandoId(null);
    }
  }


  function pedirCancelacion(id: number) {
    setConfirmandoId(id);
    if (confirmarTimeoutRef.current) clearTimeout(confirmarTimeoutRef.current);
    confirmarTimeoutRef.current = setTimeout(() => setConfirmandoId(null), 4000);
  }


  const estadoVariante: Record<EstadoSuscripcion, "moss" | "hazard" | "neutral"> = {
    ACTIVA: "moss",
    VENCIDA: "hazard",
    CANCELADA: "neutral",
  };


  if (!autorizado) {
    return <p className="font-mono text-sm text-concrete-300">Verificando acceso...</p>;
  }


  if (loading) {
    return (
      <div>
        <PageHeader
          titulo={esAdmin ? "Suscripciones" : "Mis suscripciones"}
          subtitulo={esAdmin ? "Clientes asociados a planes" : "Tus planes y fechas registradas"}
        />
        <div className={tableWrap}>
          <SkeletonFilas filas={5} />
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <OwnSubscriptionsView
        suscripciones={suscripciones}
        error={error}
      />
    );
  }


  const planSeleccionado = planes.find((plan) => plan.id === form.planId);
  const fechaFin = fechaFinEstimada(form.fechaInicio, planSeleccionado?.duracionDias);


  return (
    <div>
      <PageHeader
        titulo="Suscripciones"
        subtitulo="Clientes asociados a planes"
        acciones={
          <>
            <Select
              value={filtroEstado}
              onChange={(value) => setFiltroEstado(value as EstadoSuscripcion | "")}
              options={ESTADOS.map((estado) => ({ value: estado, label: estado }))}
              placeholder="Todos los estados"
              ariaLabel="Filtrar por estado"
              className="w-auto"
            />
            <button type="button" onClick={abrirCrear} className={buttonPrimary}>
              + Nueva suscripción
            </button>
          </>
        }
      />


      {error && <p className={`mb-4 ${errorBannerDark}`}>{error}</p>}


      <div className={tableWrap}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className={tableHead}>
            <tr>
              <th className={tableHeadCell}>Usuario</th>
              <th className={tableHeadCell}>Plan</th>
              <th className={tableHeadCell}>Inicio</th>
              <th className={tableHeadCell}>Fin</th>
              <th className={tableHeadCell}>Estado</th>
              <th className={tableHeadCell}>Acciones</th>
            </tr>
          </thead>
          <tbody className={tableRowDivide}>
            {suscripciones.map((suscripcion) => {
              const pendiente = cancelandoId === suscripcion.id;
              const confirmando = confirmandoId === suscripcion.id;
              const actionLabel = pendiente
                ? "..."
                : confirmando
                  ? "¿Seguro?"
                  : "Cancelar";


              return (
                <tr key={suscripcion.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3 text-concrete-100">{suscripcion.nombreUsuario}</td>
                  <td className="px-4 py-3 text-concrete-200">{suscripcion.nombrePlan}</td>
                  <td className="px-4 py-3 font-mono text-xs text-concrete-300">
                    {formatFecha(suscripcion.fechaInicio)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-concrete-300">
                    {formatFecha(suscripcion.fechaFin)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={badgeEstado(estadoVariante[suscripcion.estado], "dark")}>
                      {suscripcion.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {suscripcion.estado === "ACTIVA" && (
                      <button
                        type="button"
                        aria-label={actionLabel}
                        onClick={() => {
                          if (confirmando) void cancelar(suscripcion);
                          else pedirCancelacion(suscripcion.id);
                        }}
                        disabled={pendiente}
                        className={buttonDanger}
                      >
                        {actionLabel}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>


        {suscripciones.length === 0 && (
          <EmptyState mensaje="No hay suscripciones con ese filtro." variante="sinDatos" />
        )}
      </div>


      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suscripcion-modal-title"
            className={modalPanel}
          >
            <span className="rivet left-3 top-3" />
            <span className="rivet right-3 top-3" />
            <span className="rivet bottom-3 left-3" />
            <span className="rivet bottom-3 right-3" />
            <div className="hazard-stripe h-1" />


            <div className={modalBody}>
              <h2 id="suscripcion-modal-title" className="mb-4 font-display text-2xl font-bold text-concrete-100">
                Nueva suscripción
              </h2>


              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div>
                  <label className={labelClass}>Usuario</label>
                  <Select
                    value={String(form.usuarioId || "")}
                    onChange={(value) => setForm({ ...form, usuarioId: Number(value) })}
                    options={usuarios.map((usuario) => ({
                      value: String(usuario.id),
                      label: `${usuario.nombre} (${usuario.email})`,
                    }))}
                    placeholder="Selecciona un usuario"
                    ariaLabel="Usuario"
                    className="focus-visible:outline-hazard-400"
                  />
                </div>


                <div>
                  <label className={labelClass}>Plan</label>
                  <Select
                    value={String(form.planId || "")}
                    onChange={(value) => setForm({ ...form, planId: Number(value) })}
                    options={planes.filter((plan) => plan.activo).map((plan) => ({
                      value: String(plan.id),
                      label: `${plan.nombre} — ${formatMoneda(plan.precio)} (${plan.duracionDias} días)`,
                    }))}
                    placeholder={cargandoOpciones ? "Cargando planes..." : "Selecciona un plan activo"}
                    ariaLabel="Plan"
                  />
                </div>


                <div>
                  <label htmlFor="suscripcion-fecha-inicio" className={labelClass}>
                    Fecha de inicio
                  </label>
                  <input
                    id="suscripcion-fecha-inicio"
                    type="date"
                    required
                    value={form.fechaInicio}
                    onChange={(event) => setForm({ ...form, fechaInicio: event.target.value })}
                    className={input}
                  />
                </div>


                <div>
                  <label htmlFor="suscripcion-fecha-fin" className={labelClass}>
                    Fecha de fin estimada
                  </label>
                  <input
                    id="suscripcion-fecha-fin"
                    type="date"
                    value={fechaFin}
                    readOnly
                    aria-readonly="true"
                    className={`${input} cursor-not-allowed opacity-75`}
                  />
                </div>


                {formError && <p className={errorBannerDark}>{formError}</p>}


                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={cerrarForm} className={`flex-1 ${buttonSecondaryDark}`}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando || cargandoOpciones} className={`flex-1 ${buttonPrimary}`}>
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

function OwnSubscriptionsView({
  suscripciones,
  error,
}: {
  suscripciones: SuscripcionResponseDTO[];
  error: string | null;
}) {
  const estadoVariante: Record<EstadoSuscripcion, "moss" | "hazard" | "neutral"> = {
    ACTIVA: "moss",
    VENCIDA: "hazard",
    CANCELADA: "neutral",
  };

  return (
    <div>
      <PageHeader titulo="Mis suscripciones" subtitulo="Tus planes y fechas registradas" />
      {error && <p className={`mb-4 ${errorBannerDark}`}>{error}</p>}
      <div className={tableWrap}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className={tableHead}>
            <tr>
              <th className={tableHeadCell}>Plan</th>
              <th className={tableHeadCell}>Inicio</th>
              <th className={tableHeadCell}>Fin</th>
              <th className={tableHeadCell}>Estado</th>
            </tr>
          </thead>
          <tbody className={tableRowDivide}>
            {suscripciones.map((suscripcion) => (
              <tr key={suscripcion.id} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3 text-concrete-100">{suscripcion.nombrePlan}</td>
                <td className="px-4 py-3 font-mono text-xs text-concrete-300">
                  {formatFecha(suscripcion.fechaInicio)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-concrete-300">
                  {formatFecha(suscripcion.fechaFin)}
                </td>
                <td className="px-4 py-3">
                  <span className={badgeEstado(estadoVariante[suscripcion.estado], "dark")}>
                    {suscripcion.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {suscripciones.length === 0 && (
          <EmptyState mensaje="No tienes suscripciones registradas." />
        )}
      </div>
    </div>
  );
}
