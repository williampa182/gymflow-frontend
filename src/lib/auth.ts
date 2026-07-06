import { Rol } from "@/types";

export function saveSession(id: number, nombre: string, email: string, rol: Rol, token: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("rol", rol);
  localStorage.setItem("userId", String(id));
  localStorage.setItem("nombre", nombre);
  localStorage.setItem("email", email);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getRol(): Rol | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rol") as Rol | null;
}

export function getNombre(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nombre");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
  localStorage.removeItem("userId");
  localStorage.removeItem("nombre");
  localStorage.removeItem("email");
  window.location.href = "/login";
}

export function hasRole(...roles: Rol[]): boolean {
  const rol = getRol();
  return rol !== null && roles.includes(rol);
}
