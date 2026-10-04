"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Rol, UsuarioResponseDTO } from "@/types";
import { useFocusTrap } from "@/lib/useFocusTrap";
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
  buttonPrimary,
  buttonSecondaryDark,
  buttonDanger,
  badgeEstado,
  inputDark as input,
  labelDark as labelClass,
  modalBodyDark as modalBody,
  modalPanelDark as modalPanel,
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

interface FilaImportacion {
  fila: number;
  motivo: string;
}

interface ResultadoImportacion {
  totalFilas: number;
  creados: number;
  omitidos: FilaImportacion[];
  errores: FilaImportacion[];
}

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

  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const [soloValidar, setSoloValidar] = useState(true);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState<ResultadoImportacion | null>(null);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);

  const modalImportarRef = useFocusTrap(mostrarImportar, () => setMostrarImportar(false));

  function abrirImportar() {
    setArchivoCsv(null);
    setSoloValidar(true);
    setResultadoImportacion(null);
    setErrorImportacion(null);
    setMostrarImportar(true);
  }

  async function descargarPlantilla() {
    try {
      const respuesta = await api.get("/usuarios/plantilla-importacion", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(respuesta.data as Blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "plantilla-socios.csv";
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setErrorImportacion("No se pudo descargar la plantilla.");
    }
  }

  async function importarSocios() {
    if (!archivoCsv) {
      setErrorImportacion("Selecciona un archivo CSV.");
      return;
    }
    setImportando(true);
    setErrorImportacion(null);
    try {
      const formulario = new FormData();
      formulario.append("archivo", archivoCsv);
      const respuesta = await api.post<ResultadoImportacion>("/usuarios/importar", formulario, {
        params: { dryRun: soloValidar },
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultadoImportacion(respuesta.data);
      if (!soloValidar && respuesta.data.creados > 0) {
        notificar("exito", `Se importaron ${respuesta.data.creados} socios.`);
        await cargarUsuarios();
      }
    } catch (err) {
      console.error(err);
      setErrorImportacion("No se pudo importar el archivo.");
    } finally {
      setImportando(false);
    }
  }

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
          <>
            <Select
              value={filtroRol}
              onChange={(v) => setFiltroRol(v as Rol | "")}
              options={ROLES.map((r) => ({ value: r, label: r }))}
              placeholder="Todos los roles"
              ariaLabel="Filtrar por rol"
              className="w-auto"
            />
            <button type="button" onClick={abrirImportar} className={buttonSecondaryDark}>
              Importar
            </button>
          </>
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

      {mostrarImportar && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
          <div
            ref={modalImportarRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="importar-modal-title"
            className={modalPanel}
          >
            <div className={modalBody}>
              <h2 id="importar-modal-title" className="mb-4 font-display text-2xl font-bold text-concrete-100">
                Importar socios
              </h2>

              <p className="mb-3 text-sm text-concrete-300">
                Archivo CSV con header{" "}
                <span className="font-mono text-xs">nombre,tipoDocumento,numeroDocumento,telefono,email</span>.
                Acepta separador coma o punto y coma.
              </p>
              <button
                type="button"
                onClick={() => void descargarPlantilla()}
                className={`mb-4 ${buttonSecondaryDark}`}
              >
                Descargar plantilla
              </button>

              <div className="mb-3">
                <label htmlFor="importar-archivo" className={labelClass}>
                  Archivo CSV
                </label>
                <input
                  id="importar-archivo"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setArchivoCsv(event.target.files?.[0] ?? null)}
                  className={input}
                />
              </div>

              <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-concrete-100">
                <input
                  type="checkbox"
                  checked={soloValidar}
                  onChange={(event) => setSoloValidar(event.target.checked)}
                  className="h-4 w-4"
                />
                Solo validar (no guarda nada)
              </label>

              {errorImportacion && <p className={errorBannerDark}>{errorImportacion}</p>}

              {resultadoImportacion && (
                <div className="mb-3 rounded-md border border-ink-700 bg-ink-900 p-3 text-sm text-concrete-100">
                  <p>
                    Filas: {resultadoImportacion.totalFilas} · Creados:{" "}
                    {resultadoImportacion.creados} · Omitidos: {resultadoImportacion.omitidos.length} ·
                    Errores: {resultadoImportacion.errores.length}
                  </p>
                  {[...resultadoImportacion.omitidos, ...resultadoImportacion.errores].map((f) => (
                    <p key={`${f.fila}-${f.motivo}`} className="font-mono text-xs text-concrete-300">
                      Fila {f.fila}: {f.motivo}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarImportar(false)}
                  className={`flex-1 ${buttonSecondaryDark}`}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => void importarSocios()}
                  disabled={importando || !archivoCsv}
                  className={`flex-1 ${buttonPrimary}`}
                >
                  {importando ? "Importando…" : soloValidar ? "Validar" : "Importar"}
                </button>
              </div>
            </div>
          </div>
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
