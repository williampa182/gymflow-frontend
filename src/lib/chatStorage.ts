export const CLAVE_CHAT_MENSAJES = "gymflow:chat:mensajes";

export interface MensajeChat {
  id: string;
  rol: "usuario" | "asistente";
  texto: string;
}

function esMensaje(m: unknown): m is MensajeChat {
  if (!m || typeof m !== "object") return false;
  const candidato = m as Partial<MensajeChat>;
  return (
    typeof candidato.id === "string" &&
    (candidato.rol === "usuario" || candidato.rol === "asistente") &&
    typeof candidato.texto === "string"
  );
}

// sessionStorage (no localStorage): el hilo sobrevive a un F5 pero muere al
// cerrar la pestaña. Cada lectura valida forma y tipos; JSON corrupto o
// window ausente (SSR) → lista vacía.
export function cargarMensajesChat(): MensajeChat[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_CHAT_MENSAJES);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    return Array.isArray(datos) ? datos.filter(esMensaje) : [];
  } catch {
    return [];
  }
}

export function guardarMensajesChat(mensajes: MensajeChat[]): void {
  try {
    window.sessionStorage.setItem(CLAVE_CHAT_MENSAJES, JSON.stringify(mensajes));
  } catch {
    // Storage lleno o no disponible: el chat sigue funcionando en memoria.
  }
}

export function limpiarMensajesChat(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CLAVE_CHAT_MENSAJES);
  } catch {
    // Storage no disponible: nada que limpiar.
  }
}
