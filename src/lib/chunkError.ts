const CLAVE_RECARGA = "gymflow:chunk-retry";
const VENTANA_RECARGA_MS = 60_000;
const PATRONES_CHUNK = [
  "Loading chunk",
  "Loading CSS chunk",
  "Failed to load chunk",
  "Failed to fetch dynamically imported module",
];

export function esChunkLoadError(error: unknown): boolean {
  if (error === null || error === undefined || typeof error !== "object") {
    return false;
  }
  const e = error as { name?: unknown; message?: unknown };
  if (e.name === "ChunkLoadError") return true;
  const mensaje = e.message;
  if (typeof mensaje !== "string") return false;
  return PATRONES_CHUNK.some((patron) => mensaje.includes(patron));
}

export function intentarRecargaUnaVez(): boolean {
  const ahora = Date.now();
  const previo = sessionStorage.getItem(CLAVE_RECARGA);
  if (previo !== null && ahora - Number(previo) <= VENTANA_RECARGA_MS) {
    return false;
  }
  sessionStorage.setItem(CLAVE_RECARGA, String(ahora));
  window.location.reload();
  return true;
}

export function limpiarFlagRecarga(): void {
  sessionStorage.removeItem(CLAVE_RECARGA);
}