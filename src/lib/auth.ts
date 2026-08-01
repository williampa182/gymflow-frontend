import { Rol } from "@/types";
import { limpiarMensajesChat } from "./chatStorage";

interface Session {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

// §1 (security-deep-dive): antes leía document.cookie (httpOnly:false),
// manipulable por cualquier JS. Ahora lee vía endpoint server-side
// (cookie session es httpOnly:true).
//
// Cache simple en memoria para evitar un fetch por cada llamada a
// isAuthenticated()/getRol() dentro de un mismo render/efecto.
let cachedSession: Session | null | undefined = undefined;

function clearSessionCache() {
  cachedSession = undefined;
}

async function getSession(): Promise<Session | null> {
  if (typeof window === "undefined") return null;

  // Devolver cache si ya tenemos (evita fetch redundante en mismo ciclo)
  if (cachedSession !== undefined) return cachedSession;

  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) {
      cachedSession = null;
      return null;
    }
    cachedSession = (await res.json()) as Session;
    return cachedSession;
  } catch {
    cachedSession = null;
    return null;
  }
}

// Función síncrona para casos donde ya tenemos la sesión cacheada.
//
// GUARDA DE SEGURIDAD (2026-07-20): si cachedSession === undefined, significa
// que loadSession() todavía no resolvió (o nunca se llamó). Antes esto
// devolvía null silenciosamente, lo cual es indistinguible de "sesión
// inexistente" — un bug de auth que fallaría en silencio en vez de con un
// error visible. Hoy todos los call sites (dashboard/layout.tsx y sus hijos)
// están protegidos por el gate `if (!checked) return <Loading/>` del layout,
// así que este throw nunca debería dispararse en producción. Si lo hace, es
// señal de que un componente nuevo está llamando isAuthenticated/getRol/
// getNombre fuera de ese árbol protegido — hay que envolverlo con
// loadSession() antes, no silenciar este error.
function getSessionSync(): Session | null {
  if (cachedSession === undefined) {
    throw new Error(
      "getSessionSync() llamado antes de loadSession(). " +
      "Asegurate de llamar loadSession() en el layout/componente padre " +
      "antes de usar isAuthenticated()/getRol()/getNombre()."
    );
  }
  return cachedSession;
}

export function isAuthenticated(): boolean {
  return getSessionSync() !== null;
}

export function getRol(): Rol | null {
  return getSessionSync()?.rol ?? null;
}

export function getNombre(): string | null {
  return getSessionSync()?.nombre ?? null;
}

export function hasRole(...roles: Rol[]): boolean {
  const rol = getRol();
  return rol !== null && roles.includes(rol);
}

/**
 * Carga la sesión del usuario. Debe llamarse una vez al montar un componente
 * que necesite datos de sesión (ej. layout del dashboard). Después de esta
 * llamada, isAuthenticated/getRol/getNombre funcionan síncronamente.
 */
export async function loadSession(): Promise<Session | null> {
  clearSessionCache();
  return getSession();
}

export async function logout() {
  clearSessionCache();
  limpiarMensajesChat();
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}
