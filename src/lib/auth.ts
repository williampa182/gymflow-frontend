import { Rol } from "@/types";

interface Session {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

// Lee la cookie "session" (no httpOnly, solo datos no sensibles: id/nombre/email/rol).
// El JWT real vive en la cookie "token" (httpOnly) y nunca pasa por aquí.
function getSession(): Session | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/(?:^|; )session=([^;]*)/);
  if (!match) return null;

  try {
    return JSON.parse(decodeURIComponent(match[1])) as Session;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getRol(): Rol | null {
  return getSession()?.rol ?? null;
}

export function getNombre(): string | null {
  return getSession()?.nombre ?? null;
}

export function hasRole(...roles: Rol[]): boolean {
  const rol = getRol();
  return rol !== null && roles.includes(rol);
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}
