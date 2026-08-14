"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Rol, UsuarioResponseDTO } from "@/types";
import { Select } from "@/components/Select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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

type DialogoConfirmacion =
  | { tipo: "desactivar"; id: number }
  | { tipo: "rol"; id: number }
  | { tipo: "eliminar"; id: number };

export default function UsuariosPage() {
  usePageTitle("Usuarios");
  const { notificar } = useToast();
  const autorizado = useRequireRole("ADMIN");

  const [usuarios, setUsuarios] = useState<UsuarioResponseDTO[]>([]);
  const [filtroRol, setFiltroRol] = useState<Rol | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [rolPendiente, setRolPendiente] = useState<{
    id: number;
    rol: Rol;
  } | null>(null);
  const [cambiandoRolId, setCambiandoRolId] = useState<number | null>(null);
  const [dialogo, setDialogo] = useState<DialogoConfirmacion | null>(null);

  function seleccionarRol(id: number, rol: Rol) {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario || usuario.rol === rol) {
      setRolPendiente(null);
      return;
    }
    setRolPendiente({ id, rol });
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
      setDialogo(null);
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
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      const mensaje = "No se pudo cambiar el rol del usuario.";
      setError(mensaje);
      notificar("error", mensaje);
    } finally {
      setCambiandoRolId(null);
      setDialogo(null);
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
      setDialogo(null);
    }
  }

  if (!autorizado) {
    return <p className="font-mono text-sm text-concrete-300">Verificando acceso…</p>;
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
                          onClick={() => setDialogo({ tipo: "rol", id: u.id })}
                          disabled={cambiandoRolId === u.id}
                          className={buttonDanger}
                        >
                          {cambiandoRolId === u.id ? "…" : "Cambiar rol"}
                        </button>
                      )}
                      {u.activo ? (
                        <button
                          type="button"
                          onClick={() => setDialogo({ tipo: "desactivar", id: u.id })}
                          disabled={cambiandoId === u.id}
                          className={buttonDanger}
                        >
                          {cambiandoId === u.id ? "…" : "Desactivar"}
                        </button>
                      ) : (
                        <button
                          onClick={() => cambiarEstado(u)}
                          disabled={cambiandoId === u.id}
className={buttonSecondaryDark}
                        >
                          {cambiandoId === u.id ? "…" : "Activar"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDialogo({ tipo: "eliminar", id: u.id })}
                        disabled={eliminandoId === u.id}
                        className="rounded-md border border-rust-700/60 px-3 py-1 text-xs font-medium text-rust-400 transition hover:bg-rust-900/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {eliminandoId === u.id ? "…" : "Eliminar"}
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

      {dialogo && (() => {
        const usuario = usuarios.find((u) => u.id === dialogo.id);
        if (!usuario) return null;

        if (dialogo.tipo === "desactivar") {
          return (
            <ConfirmDialog
              abierto
              titulo="Desactivar usuario"
              mensaje={`¿Desactivar a ${usuario.nombre}?`}
              textoConfirmar="Desactivar"
              confirmando={cambiandoId === usuario.id}
              onCancelar={() => setDialogo(null)}
              onConfirmar={() => void cambiarEstado(usuario)}
            />
          );
        }

        if (dialogo.tipo === "rol") {
          return (
            <ConfirmDialog
              abierto
              titulo="Cambiar rol"
              mensaje={`¿Cambiar el rol de ${usuario.nombre} a ${rolPendiente?.rol}?`}
              textoConfirmar="Cambiar rol"
              confirmando={cambiandoRolId === usuario.id}
              onCancelar={() => setDialogo(null)}
              onConfirmar={() => void cambiarRol(usuario)}
            />
          );
        }

        return (
          <ConfirmDialog
            abierto
            titulo="Eliminar usuario"
            mensaje={`¿Eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`}
            textoConfirmar="Eliminar"
            confirmando={eliminandoId === usuario.id}
            onCancelar={() => setDialogo(null)}
            onConfirmar={() => void eliminarUsuario(usuario)}
          />
        );
      })()}
    </div>
  );
}
