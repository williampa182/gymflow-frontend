"use client";


import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import type { PlanRequestDTO, PlanResponseDTO, Rol, SuscripcionResponseDTO, TipoPlan } from "@/types";
import { Select } from "@/components/Select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  buttonSecondaryDark,
  errorBannerDark as errorBanner,
  inputDark as input,
  labelDark as labelClass,
  modalBodyDark as modalBody,
  modalPanelDark,
  tableHeadDark as tableHead,
  tableHeadCell,
  tableRowDivideDark as tableRowDivide,
  tableWrapDark as tableWrap,
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
  const [dialogo, setDialogo] = useState<{ id: number } | null>(null);


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
      setDialogo(null);
    }
  }


  if (!autorizado) {
    return <p className="font-mono text-sm text-concrete-300">Verificando acceso…</p>;
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
    return <PlanesDisponiblesView planes={planes} error={error} rol={rol} />;
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


              return (
<tr key={plan.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-concrete-100">{plan.nombre}</p>
                    {plan.descripcion && (
                      <p className="mt-1 text-xs text-concrete-300">{plan.descripcion}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-concrete-200">
                    {formatMoneda(plan.precio)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={badgeEstado("neutral", "dark")}>
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
                      className={buttonSecondaryDark}
                    >
                      {pendiente ? "…" : plan.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(plan)}
                        className={buttonSecondaryDark}
                      >
                        Editar
                      </button>
                      {plan.activo && (
                        <button
                          type="button"
                          disabled={pendiente}
                          onClick={() => setDialogo({ id: plan.id })}
                          className={buttonDanger}
                        >
                          {pendiente ? "…" : "Desactivar"}
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
            className={modalPanelDark}
          >
            <span className="rivet left-3 top-3" />
            <span className="rivet right-3 top-3" />
            <span className="rivet bottom-3 left-3" />
            <span className="rivet bottom-3 right-3" />
            <div className="hazard-stripe h-1" />


            <div className={modalBody}>
              <h2 id="plan-modal-title" className="mb-4 font-display text-2xl font-bold text-concrete-100">
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
                    <p id="plan-nombre-error" className="mt-1 text-xs text-rust-100">
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
                      <p id="plan-precio-error" className="mt-1 text-xs text-rust-100">
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
                      <p id="plan-duracion-error" className="mt-1 text-xs text-rust-100">
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
                  <label htmlFor="plan-clases" className="text-sm text-concrete-200">Incluye clases</label>
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
                  <label htmlFor="plan-entrenador" className="text-sm text-concrete-200">
                    Incluye entrenador personal
                  </label>
                </div>


                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={cerrarForm} className={`flex-1 ${buttonSecondaryDark}`}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando} className={`flex-1 ${buttonPrimary}`}>
                    {guardando ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={dialogo !== null}
        titulo="Desactivar plan"
        mensaje={`¿Desactivar el plan "${planes.find((p) => p.id === dialogo?.id)?.nombre}"?`}
        textoConfirmar="Desactivar"
        confirmando={dialogo !== null && cambiandoId === dialogo.id}
        onCancelar={() => setDialogo(null)}
        onConfirmar={() => {
          const plan = planes.find((p) => p.id === dialogo?.id);
          if (plan) void cambiarEstado(plan);
        }}
      />
    </div>
  );
}

function PlanesDisponiblesView({
  planes,
  error,
  rol,
}: {
  planes: PlanResponseDTO[];
  error: string | null;
  rol: Rol;
}) {
  // Fase 3: solo CLIENTE puede autosuscibirse. ENTRENADOR ve el catálogo en
  // solo lectura; el rol se re-valida en el backend (POST /suscripciones/mi
  // exige autenticación y la identidad sale del JWT, jamás de un id del body).
  const esCliente = rol === "CLIENTE";
  const { notificar } = useToast();
  const [inscribiendoPlan, setInscribiendoPlan] = useState<PlanResponseDTO | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [yaInscripto, setYaInscripto] = useState(false);

  function cerrarModal() {
    if (!guardando) setInscribiendoPlan(null);
  }
  const modalRef = useFocusTrap(inscribiendoPlan !== null, cerrarModal);

  // Precomputa si el CLIENTE ya es miembro: si lo es, el botón se reemplaza
  // por un badge (evita el 409 como flujo normal). Fetch silencioso: si
  // falla, se puede intentar inscribir igual — el backend valida y avisa.
  useEffect(() => {
    if (!esCliente) return;
    let activo = true;
    api
      .get<PageResponse<SuscripcionResponseDTO>>("/suscripciones/mis")
      .then((respuesta) => {
        if (activo && respuesta.data.content.some((s) => s.estado === "ACTIVA")) {
          setYaInscripto(true);
        }
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [esCliente]);

  async function inscribir() {
    if (!inscribiendoPlan) return;
    setGuardando(true);
    try {
      // Pago mock (demo de portafolio): no hay pasarela real; el POST
      // simula la aprobación y el backend activa la membresía.
      await api.post("/suscripciones/mi", { planId: inscribiendoPlan.id });
      notificar("exito", `¡Listo! Ya sos miembro de ${inscribiendoPlan.nombre}.`);
      setYaInscripto(true);
      setInscribiendoPlan(null);
    } catch (err) {
      const mensaje = mensajeDeError(err, "No se pudo completar la inscripción.");
      notificar("error", mensaje);
      // 409 = ya tiene una suscripción activa: es informativo, el estado
      // real es "miembro", así que el badge reemplaza al botón.
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setYaInscripto(true);
      }
      setInscribiendoPlan(null);
    } finally {
      setGuardando(false);
    }
  }

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
              {esCliente && <th className={tableHeadCell}>Membresía</th>}
            </tr>
          </thead>
          <tbody className={tableRowDivide}>
            {planesActivos.map((plan) => (
              <tr key={plan.id} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3">
                  <p className="font-medium text-concrete-100">{plan.nombre}</p>
                  {plan.descripcion && (
                    <p className="mt-1 text-xs text-concrete-300">{plan.descripcion}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-concrete-200">
                  {formatMoneda(plan.precio)}
                </td>
                <td className="px-4 py-3">
                  <span className={badgeEstado("neutral", "dark")}>
                    {plan.tipo} · {plan.duracionDias} días
                  </span>
                </td>
                {esCliente &&
                  (yaInscripto ? (
                    <td className="px-4 py-3">
                      <span className={badgeEstado("moss", "dark")}>Ya sos miembro</span>
                    </td>
                  ) : (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setInscribiendoPlan(plan)}
                        className={buttonPrimary}
                      >
                        Inscribirme
                      </button>
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>

        {planesActivos.length === 0 && (
          <EmptyState mensaje="No hay planes activos disponibles." variante="sinDatos" />
        )}
      </div>

      {inscribiendoPlan && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inscribir-modal-title"
            className={modalPanelDark}
          >
            <span className="rivet left-3 top-3" />
            <span className="rivet right-3 top-3" />
            <span className="rivet bottom-3 left-3" />
            <span className="rivet bottom-3 right-3" />
            <div className="hazard-stripe h-1" />

            <div className={modalBody}>
              <h2 id="inscribir-modal-title" className="mb-4 font-display text-2xl font-bold text-concrete-100">
                Confirmar inscripción
              </h2>

              <dl className="space-y-2 text-sm text-concrete-200">
                <div className="flex justify-between gap-4">
                  <dt>Plan</dt>
                  <dd className="font-medium text-concrete-100">{inscribiendoPlan.nombre}</dd>
                </div>
                {inscribiendoPlan.descripcion && (
                  <div className="flex justify-between gap-4">
                    <dt>Detalle</dt>
                    <dd className="text-right text-concrete-300">{inscribiendoPlan.descripcion}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt>Precio</dt>
                  <dd className="font-mono text-concrete-100">{formatMoneda(inscribiendoPlan.precio)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Vigencia</dt>
                  <dd className="text-concrete-100">
                    {inscribiendoPlan.tipo} · {inscribiendoPlan.duracionDias} días desde hoy
                  </dd>
                </div>
              </dl>

              <p className="mt-4 rounded-md border border-ink-700 bg-ink-900/60 px-3 py-2 text-xs text-concrete-300">
                Pago de demostración (demo de portafolio): no hay pasarela
                real. El pago simula la aprobación y activa tu membresía.
              </p>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={cerrarModal}
                  className={`flex-1 ${buttonSecondaryDark}`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => void inscribir()}
                  className={`flex-1 ${buttonPrimary}`}
                >
                  {guardando
                    ? "Procesando…"
                    : `Pagar ${formatMoneda(inscribiendoPlan.precio)} (demo)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
