/**
 * Indica si un error de Axios corresponde a una sesión terminada: un 401, o
 * un 403 con body vacío (el Http403ForbiddenEntryPoint del backend responde
 * así cuando el token falta o es inválido). Un 403 con body JSON es un
 * rechazo de permisos de la app y NO debe redirigir.
 */
export function sesionTerminada(error: unknown): boolean {
  const response = (error as {
    response?: { status?: unknown; data?: unknown };
  })?.response;
  if (!response) return false;
  if (response.status === 401) return true;
  if (response.status !== 403) return false;
  const data = response.data;
  if (data == null) return true;
  if (typeof data === "string") return data === "";
  if (typeof data === "object") return Object.keys(data).length === 0;
  return false;
}