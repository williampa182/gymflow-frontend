"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { hasRole } from "@/lib/auth";
import { Rol, UsuarioResponseDTO } from "@/types";
import {
  input,
  errorBanner,
  buttonSecondary,
  badgeEstado,
  tableWrap,
  tableHead,
  tableHeadCell,
  tableRowDivide,
} from "@/lib/ui";

const ROLES: Rol[] = ["ADMIN", "ENTRENADOR", "CLIENTE"];

export default function UsuariosPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    if (!hasRole("ADMIN")) {
      router.replace("/dashboard");
      return;
    }
    setAutorizado(true);
  }, [router]);

  const [usuarios, setUsuarios] = useState<UsuarioResponseDTO[]>([]);
  const [filtroRol, setFiltroRol] = useState<Rol | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);

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
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado del usuario.");
    } finally {
      setCambiandoId(null);
    }
  }

  if (!autorizado) {
    return <p className="font-mono text-sm text-ink-500">Verificando acceso...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink-900">Usuarios</h1>

        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value as Rol | "")}
          className={`${input} w-auto`}
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={`mb-4 ${errorBanner}`}>{error}</p>}

      {loading ? (
        <p className="font-mono text-sm text-ink-500">Cargando usuarios...</p>
      ) : (
        <div className={tableWrap}>
          <table className="w-full min-w-[720px] text-left text-sm">
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
                <tr key={u.id} className="transition-colors hover:bg-concrete-100/70">
                  <td className="px-4 py-3 text-ink-900">{u.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={badgeEstado("neutral")}>{u.rol}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={badgeEstado(u.activo ? "moss" : "neutral")}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {new Date(u.creadoEn).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => cambiarEstado(u)}
                      disabled={cambiandoId === u.id}
                      className={buttonSecondary}
                    >
                      {cambiandoId === u.id ? "..." : u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuarios.length === 0 && (
            <p className="px-4 py-6 text-center font-mono text-sm text-ink-500">
              No hay usuarios con ese filtro.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
