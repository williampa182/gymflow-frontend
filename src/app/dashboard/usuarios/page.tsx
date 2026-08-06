"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Rol, UsuarioResponseDTO } from "@/types";
import { Select } from "@/components/Select";
import { useToast } from "@/lib/toast";
import { useRequireRole } from "@/lib/useRequireRole";
import { usePageTitle } from "@/lib/usePageTitle";
import { formatFecha } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonFilas } from "@/components/Skeleton";
import {
  errorBannerDark,
  buttonSecondaryDark,
  buttonDanger,
  badgeEstado,
  tableWrapDark as tableWrap,
  tableHeadDark as tableHead,
  tableHeadCell,
  tableRowDivideDark as tableRowDivide,
} from "@/lib/ui";

const ROLES: Rol[] = ["ADMIN", "ENTRENADOR", "CLIENTE"];

export default function UsuariosPage() {
  usePageTitle("Usuarios");
  const { notificar } = useToast();
  const autorizado = useRequireRole("ADMIN");

  const [usuarios, setUsuarios] = useState<UsuarioResponseDTO[]>([]);
  const [filtroRol, setFiltroRol] = useState<Rol | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [confirmandoEliminacionId, setConfirmandoEliminacionId] = useState<number | null>(null);
  const [rolPendiente, setRolPendiente] = useState<{
    id: number;
    rol: Rol;
  } | null>(null);
  const [confirmandoRolId, setConfirmandoRolId] = useState<number | null>(null);
  const [cambiandoRolId, setCambiandoRolId] = useState<number | null>(null);
  const confirmarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmarRolTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmarEliminacionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El timeout evita que el botón quede pegado en "¿Seguro?" para siempre.
  useEffect(() => {
    return () => {
      if (confirmarTimeoutRef.current) clearTimeout(confirmarTimeoutRef.current);
      if (confirmarRolTimeoutRef.current) {
        clearTimeout(confirmarRolTimeoutRef.current);
      }
      if (confirmarEliminacionTimeoutRef.current) {
        clearTimeout(confirmarEliminacionTimeoutRef.current);
      }
    };
  }, []);

  function pedirConfirmacion(id: number) {
    setConfirmandoId(id);
    if (confirmarTimeoutRef.current) clearTimeout(confirmarTimeoutRef.current);
    confirmarTimeoutRef.current = setTimeout(() => setConfirmandoId(null), 4000);
  }

  function seleccionarRol(id: number, rol: Rol) {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario || usuario.rol === rol) {
      setRolPendiente(null);
      setConfirmandoRolId(null);
      return;
    }
    setRolPendiente({ id, rol });
    setConfirmandoRolId(null);
    if (confirmarRolTimeoutRef.current) {
      clearTimeout(confirmarRolTimeoutRef.current);
      confirmarRolTimeoutRef.current = null;
    }
  }

  function pedirConfirmacionRol(id: number) {
    setConfirmandoRolId(id);
    if (confirmarRolTimeoutRef.current) {
      clearTimeout(confirmarRolTimeoutRef.current);
    }
    confirmarRolTimeoutRef.current = setTimeout(
      () => setConfirmandoRolId(null),
      4000
    );
  }

  async function cargarUsuarios() {
    setLoading(true);
    setError(null);
    try {
      // El backend devuelve Page<UsuarioResponseDTO> desde la paginación (3.3).
      const res = await api.get<{ content: UsuarioResponseDTO[] }>("/usuarios", {
        params: filtroRol ? { rol: filtroRol } : {},
      });
      setUsuarios(res.data.content);
    } catch (err) {
      setError("No se pudieron cargar los usuarios.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autorizado) cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRol, autorizado]);

  async function cambiarEstado(usuario: UsuarioResponseDTO) {
    setCambiandoId(usuario.id);
    try {
      await api.patch(`/usuarios/${usuario.id}/estado`, null, {
        params: { activo: !usuario.activo },
      });
      notificar("exito", usuario.activo ? "Usuario desactivado." : "Usuario activado.");
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado del usuario.");
    } finally {
      setCambiandoId(null);
      setConfirmandoId(null);
    }
  }

  async function cambiarRol(usuario: UsuarioResponseDTO) {
    const cambio = rolPendiente?.id === usuario.id ? rolPendiente.rol : null;
    if (!cambio || cambio === usuario.rol) return;

    setCambiandoRolId(usuario.id);
    setError(null);
    try {
      await api.patch(`/usuarios/${usuario.id}/rol`, { rol: cambio });
      notificar("exito", "Rol actualizado");
      setRolPendiente(null);
      setConfirmandoRolId(null);
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      const mensaje = "No se pudo cambiar el rol del usuario.";
      setError(mensaje);
      notificar("error", mensaje);
    } finally {
      setCambiandoRolId(null);
      setConfirmandoRolId(null);
    }
  }

  async function eliminarUsuario(usuario: UsuarioResponseDTO) {
    setEliminandoId(usuario.id);
    setError(null);
    try {
      await api.delete(`/usuarios/${usuario.id}`);
      notificar("exito", "Usuario eliminado.");
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      const mensaje = "No se pudo eliminar el usuario.";
      setError(mensaje);
      notificar("error", mensaje);
    } finally {
      setEliminandoId(null);
      setConfirmandoEliminacionId(null);
    }
  }

  function pedirConfirmacionEliminacion(id: number) {
    setConfirmandoEliminacionId(id);
    if (confirmarEliminacionTimeoutRef.current) {
      clearTimeout(confirmarEliminacionTimeoutRef.current);
    }
    confirmarEliminacionTimeoutRef.current = setTimeout(
      () => setConfirmandoEliminacionId(null),
      4000
    );
  }

  if (!autorizado) {
    return <p className="font-mono text-sm text-concrete-300">Verificando acceso...</p>;
  }

  return (
    <div>
      <PageHeader
        titulo="Usuarios"
        acciones={
          <Select
            value={filtroRol}
            onChange={(v) => setFiltroRol(v as Rol | "")}
            options={ROLES.map((r) => ({ value: r, label: r }))}
            placeholder="Todos los roles"
            ariaLabel="Filtrar por rol"
            className="w-auto"
          />
        }
      />

      {error && <p className={`mb-4 ${errorBannerDark}`}>{error}</p>}

      {loading ? (
        <div className={tableWrap}>
          <SkeletonFilas filas={5} />
        </div>
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className={tableHead}>
              <tr>
                <th className={tableHeadCell}>Nombre</th>
                <th className={tableHeadCell}>Email</th>
                <th className={tableHeadCell}>Rol</th>
                <th className={tableHeadCell}>Estado</th>
                <th className={tableHeadCell}>Registrado</th>
                <th className={tableHeadCell}></th>
              </tr>
            </thead>
            <tbody className={tableRowDivide}>
              {usuarios.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3 text-concrete-100">{u.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-concrete-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={rolPendiente?.id === u.id ? rolPendiente.rol : u.rol}
                      onChange={(v) => seleccionarRol(u.id, v as Rol)}
                      options={ROLES.map((r) => ({ value: r, label: r }))}
                      ariaLabel={`Rol de ${u.nombre}`}
                      className="min-w-36"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={badgeEstado(u.activo ? "moss" : "neutral", "dark")}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-concrete-300">
                    {formatFecha(u.creadoEn)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {rolPendiente?.id === u.id && rolPendiente.rol !== u.rol && (
                        <button
                          type="button"
                          onClick={() =>
                            confirmandoRolId === u.id
                              ? cambiarRol(u)
                              : pedirConfirmacionRol(u.id)
                          }
                          disabled={cambiandoRolId === u.id}
                          className={buttonDanger}
                        >
                          {cambiandoRolId === u.id
                            ? "..."
                            : confirmandoRolId === u.id
                            ? "Confirmar cambio"
                            : "Cambiar rol"}
                        </button>
                      )}
                      {u.activo ? (
                        <button
                          onClick={() =>
                            confirmandoId === u.id
                              ? cambiarEstado(u)
                              : pedirConfirmacion(u.id)
                          }
                          disabled={cambiandoId === u.id}
                          className={
                            confirmandoId === u.id
                              ? "rounded-md bg-rust-600 px-3 py-1 text-xs font-medium text-concrete-50 transition hover:bg-rust-700 disabled:cursor-not-allowed disabled:opacity-50"
                              : buttonDanger
                          }
                        >
                          {cambiandoId === u.id
                            ? "..."
                            : confirmandoId === u.id
                            ? "¿Seguro?"
                            : "Desactivar"}
                        </button>
                      ) : (
                        <button
                          onClick={() => cambiarEstado(u)}
                          disabled={cambiandoId === u.id}
className={buttonSecondaryDark}
                        >
                          {cambiandoId === u.id ? "..." : "Activar"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          confirmandoEliminacionId === u.id
                            ? eliminarUsuario(u)
                            : pedirConfirmacionEliminacion(u.id)
                        }
                        disabled={eliminandoId === u.id}
                        className={
                          confirmandoEliminacionId === u.id
                            ? "rounded-md bg-rust-600 px-3 py-1 text-xs font-medium text-concrete-50 transition hover:bg-rust-700 disabled:cursor-not-allowed disabled:opacity-50"
                            : "rounded-md border border-rust-700/60 px-3 py-1 text-xs font-medium text-rust-400 transition hover:bg-rust-900/30 disabled:cursor-not-allowed disabled:opacity-50"
                        }
                      >
                        {eliminandoId === u.id
                          ? "..."
                          : confirmandoEliminacionId === u.id
                          ? "¿Eliminar? Sí"
                          : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuarios.length === 0 && (
            <EmptyState
              mensaje="No hay usuarios con ese filtro."
              variante={filtroRol ? "sinResultados" : "sinDatos"}
            />
          )}
        </div>
      )}
    </div>
  );
}
