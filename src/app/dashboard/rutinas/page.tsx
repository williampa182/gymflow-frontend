"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import type {
  ClienteElegibleDTO,
  EjercicioRequestDTO,
  MiEntrenadorDTO,
  Rol,
  RutinaRequestDTO,
  RutinaResponseDTO,
} from "@/types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonFilas } from "@/components/Skeleton";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { usePageTitle } from "@/lib/usePageTitle";
import { useRequireRole } from "@/lib/useRequireRole";
import { useToast } from "@/lib/toast";
import {
  buttonDanger,
  buttonPrimary,
  buttonSecondaryDark,
  errorBannerDark as errorBanner,
  inputDark as input,
  labelDark as labelClass,
  modalBodyDark as modalBody,
  modalPanelDark,
  tableCellMutedDark as tableCellMuted,
  tableHeadDark as tableHead,
  tableHeadCell,
  tableRowDivideDark as tableRowDivide,
  tableWrapDark as tableWrap,
} from "@/lib/ui";

const ROLES_PERMITIDOS: Rol[] = ["ENTRENADOR", "CLIENTE"];

type FormErrors = Partial<Record<"nombre" | "ejercicios", string>>;

function ejercicioVacio(): EjercicioRequestDTO {
  return { nombre: "", series: 3, repeticiones: 10 };
}

function formularioVacio(): RutinaRequestDTO {
  return { nombre: "", descripcion: "", ejercicios: [ejercicioVacio()] };
}

function mensajeDeError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string };
    return data.message ?? fallback;
  }
  return fallback;
}

export default function RutinasPage() {
  const rol = getRol() ?? "CLIENTE";
  const esEntrenador = rol === "ENTRENADOR";
  usePageTitle("Rutinas");
  const autorizado = useRequireRole(ROLES_PERMITIDOS, "/dashboard");
  const { notificar } = useToast();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ENTRENADOR
  const [rutinas, setRutinas] = useState<RutinaResponseDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteElegibleDTO[]>([]);

  // CLIENTE
  const [misRutinas, setMisRutinas] = useState<RutinaResponseDTO[]>([]);
  const [miEntrenador, setMiEntrenador] = useState<MiEntrenadorDTO | null>(null);

  // Modal crear/editar rutina
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<RutinaRequestDTO>(formularioVacio());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [guardando, setGuardando] = useState(false);

  // Asignación de rutina a cliente (por fila de rutina)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("");

  const modalRef = useFocusTrap(mostrarForm, cerrarForm);

  function cerrarForm() {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(formularioVacio());
    setFormErrors({});
  }

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      if (esEntrenador) {
        const [rutinasRes, clientesRes] = await Promise.all([
          api.get<RutinaResponseDTO[]>("/rutinas"),
          api.get<ClienteElegibleDTO[]>("/entrenador/clientes-elegibles"),
        ]);
        setRutinas(rutinasRes.data);
        setClientes(clientesRes.data);
      } else {
        const [rutinasRes, entrenadorRes] = await Promise.all([
          api.get<RutinaResponseDTO[]>("/rutinas/mias"),
          api.get<MiEntrenadorDTO>("/entrenador/mio").catch(() => null),
        ]);
        setMisRutinas(rutinasRes.data);
        setMiEntrenador(entrenadorRes?.data ?? null);
      }
    } catch (err) {
      setError("No se pudieron cargar los datos.");
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (autorizado) {
      cargarDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizado]);

  async function guardarRutina() {
    const errores: FormErrors = {};
    if (!form.nombre.trim()) errores.nombre = "El nombre es obligatorio";
    if (form.ejercicios.length === 0) errores.ejercicios = "Agregá al menos un ejercicio";
    for (const ejercicio of form.ejercicios) {
      if (!ejercicio.nombre.trim()) {
        errores.ejercicios = "Todos los ejercicios necesitan nombre";
        break;
      }
    }
    setFormErrors(errores);
    if (Object.keys(errores).length > 0) return;

    setGuardando(true);
    try {
      const payload = {
        ...form,
        ejercicios: form.ejercicios.map((ejercicio) => ({
          ...ejercicio,
          // El orden lo deriva el servidor; no se manda.
        })),
      };
      if (editandoId === null) {
        await api.post("/rutinas", payload);
        notificar("exito", "Rutina creada");
      } else {
        await api.put(`/rutinas/${editandoId}`, payload);
        notificar("exito", "Rutina actualizada");
      }
      cerrarForm();
      cargarDatos();
    } catch (err) {
      notificar("error", mensajeDeError(err, "No se pudo guardar la rutina"));
    } finally {
      setGuardando(false);
    }
  }

  async function desactivarRutina(rutinaId: number) {
    try {
      await api.delete(`/rutinas/${rutinaId}`);
      notificar("exito", "Rutina desactivada");
      cargarDatos();
    } catch (err) {
      notificar("error", mensajeDeError(err, "No se pudo desactivar la rutina"));
    }
  }

  async function asignarRutina(rutinaId: number) {
    if (!clienteSeleccionado) {
      notificar("error", "Elegí un cliente para asignar");
      return;
    }
    try {
      await api.post(`/rutinas/${rutinaId}/asignar/${clienteSeleccionado}`);
      notificar("exito", "Rutina asignada");
      setClienteSeleccionado("");
    } catch (err) {
      notificar("error", mensajeDeError(err, "No se pudo asignar la rutina"));
    }
  }

  async function acompañar(clienteId: number) {
    try {
      await api.post(`/entrenador/asignarme/${clienteId}`);
      notificar("exito", "Ahora acompañás a este cliente");
      cargarDatos();
    } catch (err) {
      notificar("error", mensajeDeError(err, "No se pudo asignar el acompañamiento"));
    }
  }

  async function cancelarAcompañamiento(clienteId: number) {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente?.asignacionId) return;
    try {
      await api.delete(`/entrenador/${cliente.asignacionId}`);
      notificar("exito", "Acompañamiento cancelado");
      cargarDatos();
    } catch (err) {
      notificar("error", mensajeDeError(err, "No se pudo cancelar el acompañamiento"));
    }
  }

  if (!autorizado) {
    return <div className="min-h-screen bg-ink-900" />;
  }

  const acompanados = clientes.filter((c) => c.yaAcompaño);

  return (
    <div>
      <PageHeader
        titulo="Mis rutinas"
        subtitulo={
          esEntrenador
            ? "Creá rutinas y asignalas a tus clientes acompañados"
            : "El entrenamiento que tu acompañante te preparó"
        }
        acciones={
          esEntrenador ? (
            <button
              onClick={() => {
                setEditandoId(null);
                setForm(formularioVacio());
                setMostrarForm(true);
              }}
              className={buttonPrimary}
            >
              + Nueva rutina
            </button>
          ) : undefined
        }
      />

      {error && <div className={errorBanner}>{error}</div>}

      {cargando ? (
        <SkeletonFilas filas={4} />
      ) : esEntrenador ? (
        <div className="space-y-6">
          {/* Clientes para acompañar */}
          <section className={tableWrap}>
            <div className="border-b border-ink-700 px-4 py-3">
              <h2 className="font-display text-lg font-semibold text-concrete-100">
                Clientes con acompañamiento incluido
              </h2>
              <p className="mt-0.5 font-mono text-xs text-concrete-300">
                Según el plan activo de cada cliente
              </p>
            </div>
            {clientes.length === 0 ? (
              <EmptyState mensaje="Todavía no hay clientes con acompañamiento en su plan" />
            ) : (
              <table className="w-full text-left">
                <thead className={tableHead}>
                  <tr>
                    <th className={tableHeadCell}>Cliente</th>
                    <th className={tableHeadCell}>Estado</th>
                    <th className={`${tableHeadCell} text-right`}>Acción</th>
                  </tr>
                </thead>
                <tbody className={tableRowDivide}>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className={tableCellMuted}>{cliente.nombre}</td>
                      <td className={tableCellMuted}>
                        {cliente.yaAcompaño ? (
                          <span className="inline-flex rounded-sm bg-moss-600/15 px-2 py-0.5 font-mono text-xs text-moss-400">
                            Acompañado por vos
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-concrete-300">
                            Sin acompañante
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cliente.yaAcompaño ? (
                          <button
                            onClick={() => cancelarAcompañamiento(cliente.id)}
                            className={`text-xs ${buttonSecondaryDark}`}
                          >
                            Cancelar acompañamiento
                          </button>
                        ) : (
                          <button
                            onClick={() => acompañar(cliente.id)}
                            className={`text-xs ${buttonPrimary}`}
                          >
                            Acompañar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Mis rutinas */}
          <section className={tableWrap}>
            <div className="border-b border-ink-700 px-4 py-3">
              <h2 className="font-display text-lg font-semibold text-concrete-100">
                Rutinas creadas
              </h2>
            </div>
            {rutinas.length === 0 ? (
              <EmptyState mensaje="Todavía no creaste ninguna rutina" />
            ) : (
              <div className="divide-y divide-white/10">
                {rutinas.map((rutina) => {
                  const asignables = acompanados;
                  return (
                    <div key={rutina.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-concrete-50">{rutina.nombre}</h3>
                          {rutina.descripcion && (
                            <p className="mt-0.5 text-sm text-concrete-300">{rutina.descripcion}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-sm px-2 py-0.5 font-mono text-xs ${
                              rutina.activo
                                ? "bg-moss-600/15 text-moss-400"
                                : "bg-hazard-400/15 text-hazard-400"
                            }`}
                          >
                            {rutina.activo ? "Activa" : "Desactivada"}
                          </span>
                          <button
                            onClick={() => {
                              setEditandoId(rutina.id);
                              setForm({
                                nombre: rutina.nombre,
                                descripcion: rutina.descripcion,
                                ejercicios: rutina.ejercicios.map((ejercicio) => ({
                                  id: ejercicio.id,
                                  nombre: ejercicio.nombre,
                                  series: ejercicio.series,
                                  repeticiones: ejercicio.repeticiones,
                                })),
                              });
                              setMostrarForm(true);
                            }}
                            className={`text-xs ${buttonSecondaryDark}`}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Desactivar "${rutina.nombre}"?`)) {
                                desactivarRutina(rutina.id);
                              }
                            }}
                            className={`text-xs ${buttonDanger}`}
                            disabled={!rutina.activo}
                          >
                            Desactivar
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className={tableHead}>
                            <tr>
                              <th className={tableHeadCell}>#</th>
                              <th className={tableHeadCell}>Ejercicio</th>
                              <th className={tableHeadCell}>Series</th>
                              <th className={tableHeadCell}>Repeticiones</th>
                            </tr>
                          </thead>
                          <tbody className={tableRowDivide}>
                            {rutina.ejercicios.map((ejercicio) => (
                              <tr key={ejercicio.id}>
                                <td className={tableCellMuted}>{ejercicio.orden}</td>
                                <td className={tableCellMuted}>{ejercicio.nombre}</td>
                                <td className={tableCellMuted}>{ejercicio.series}</td>
                                <td className={tableCellMuted}>{ejercicio.repeticiones}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {rutina.activo && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <label className={`font-mono text-xs ${labelClass}`} htmlFor={`cliente-${rutina.id}`}>
                            Asignar a:
                          </label>
                          <select
                            id={`cliente-${rutina.id}`}
                            value={clienteSeleccionado}
                            onChange={(event) => setClienteSeleccionado(event.target.value)}
                            disabled={asignables.length === 0}
                            className={input}
                          >
                            <option value="">
                              {asignables.length === 0
                                ? "Sin clientes acompañados"
                                : "Elegí un cliente"}
                            </option>
                            {asignables.map((cliente) => (
                              <option key={cliente.id} value={cliente.id}>
                                {cliente.nombre}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => asignarRutina(rutina.id)}
                            disabled={asignables.length === 0}
                            className={`text-xs ${buttonPrimary}`}
                          >
                            Asignar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mi entrenador */}
          <section className={tableWrap}>
            <div className="border-b border-ink-700 px-4 py-3">
              <h2 className="font-display text-lg font-semibold text-concrete-100">
                Tu acompañante
              </h2>
            </div>
            {miEntrenador ? (
              <div className="flex items-center gap-3 px-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-hazard-400/15 font-display text-sm font-bold text-hazard-400">
                  {miEntrenador.nombre
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((parte) => parte[0]?.toUpperCase() ?? "")
                    .join("") || "?"}
                </span>
                <div>
                  <p className="font-medium text-concrete-50">{miEntrenador.nombre}</p>
                  <p className="font-mono text-xs text-concrete-300">
                    Tu entrenador personal
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState mensaje="Todavía no tenés un entrenador asignado" />
            )}
          </section>

          {/* Mis rutinas */}
          <section className={tableWrap}>
            <div className="border-b border-ink-700 px-4 py-3">
              <h2 className="font-display text-lg font-semibold text-concrete-100">
                Mis rutinas
              </h2>
            </div>
            {misRutinas.length === 0 ? (
              <EmptyState mensaje="Tu entrenador todavía no te asignó rutinas" />
            ) : (
              <div className="divide-y divide-white/10">
                {misRutinas.map((rutina) => (
                  <div key={rutina.id} className="px-4 py-4">
                    <h3 className="font-semibold text-concrete-50">{rutina.nombre}</h3>
                    {rutina.descripcion && (
                      <p className="mt-0.5 text-sm text-concrete-300">{rutina.descripcion}</p>
                    )}
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className={tableHead}>
                          <tr>
                            <th className={tableHeadCell}>#</th>
                            <th className={tableHeadCell}>Ejercicio</th>
                            <th className={tableHeadCell}>Series</th>
                            <th className={tableHeadCell}>Repeticiones</th>
                          </tr>
                        </thead>
                        <tbody className={tableRowDivide}>
                          {rutina.ejercicios.map((ejercicio) => (
                            <tr key={ejercicio.id}>
                              <td className={tableCellMuted}>{ejercicio.orden}</td>
                              <td className={tableCellMuted}>{ejercicio.nombre}</td>
                              <td className={tableCellMuted}>{ejercicio.series}</td>
                              <td className={tableCellMuted}>{ejercicio.repeticiones}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal crear/editar rutina */}
      {mostrarForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div ref={modalRef} className={modalPanelDark}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                guardarRutina();
              }}
            >
              <div className={modalBody}>
                <h2 className="font-display text-xl font-semibold text-concrete-50">
                  {editandoId === null ? "Nueva rutina" : "Editar rutina"}
                </h2>

                <div className="mt-4">
                  <label htmlFor="rutina-nombre" className={labelClass}>
                    Nombre
                  </label>
                  <input
                    id="rutina-nombre"
                    className={input}
                    value={form.nombre}
                    onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                    placeholder="Ej. Full Body"
                  />
                  {formErrors.nombre && (
                    <p className="mt-1 text-xs text-hazard-400">{formErrors.nombre}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label htmlFor="rutina-descripcion" className={labelClass}>
                    Descripción (opcional)
                  </label>
                  <input
                    id="rutina-descripcion"
                    className={input}
                    value={form.descripcion}
                    onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
                    placeholder="Ej. Rutina de arranque"
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={labelClass}>Ejercicios</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          ejercicios: [...form.ejercicios, ejercicioVacio()],
                        })
                      }
                      className={`text-xs ${buttonSecondaryDark}`}
                    >
                      + Agregar ejercicio
                    </button>
                  </div>
                  {formErrors.ejercicios && (
                    <p className="mb-2 text-xs text-hazard-400">{formErrors.ejercicios}</p>
                  )}
                  <div className="space-y-3">
                    {form.ejercicios.map((ejercicio, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-1">
                          <input
                            className={input}
                            value={ejercicio.nombre}
                            onChange={(event) => {
                              const ejercicios = [...form.ejercicios];
                              ejercicios[index] = { ...ejercicio, nombre: event.target.value };
                              setForm({ ...form, ejercicios });
                            }}
                            placeholder={`Ejercicio ${index + 1}`}
                            aria-label={`Nombre del ejercicio ${index + 1}`}
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min={1}
                            className={input}
                            value={ejercicio.series}
                            onChange={(event) => {
                              const ejercicios = [...form.ejercicios];
                              ejercicios[index] = {
                                ...ejercicio,
                                series: Number(event.target.value),
                              };
                              setForm({ ...form, ejercicios });
                            }}
                            aria-label={`Series del ejercicio ${index + 1}`}
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min={1}
                            className={input}
                            value={ejercicio.repeticiones}
                            onChange={(event) => {
                              const ejercicios = [...form.ejercicios];
                              ejercicios[index] = {
                                ...ejercicio,
                                repeticiones: Number(event.target.value),
                              };
                              setForm({ ...form, ejercicios });
                            }}
                            aria-label={`Repeticiones del ejercicio ${index + 1}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const ejercicios = form.ejercicios.filter((_, i) => i !== index);
                            setForm({ ...form, ejercicios });
                          }}
                          className={`px-2 text-xs ${buttonDanger}`}
                          aria-label={`Quitar ejercicio ${index + 1}`}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-ink-700 px-6 py-4">
                <button type="button" onClick={cerrarForm} className={buttonSecondaryDark}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className={buttonPrimary}>
                  {guardando ? "Guardando…" : editandoId === null ? "Crear rutina" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
