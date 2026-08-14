import axios from "axios";
import { sesionTerminada } from "./manejo-sesion";

// Ya no apunta directo al backend: pasa por nuestro proxy en /api/backend,
// que es el único que puede leer la cookie httpOnly con el JWT y adjuntarla
// como Authorization header. El navegador nunca maneja el token directamente.
const api = axios.create({
  baseURL: "/api/backend",
  headers: {
    "Content-Type": "application/json",
  },
  // L2 (revisión 2026-08-01): sin timeout un request colgado queda
  // indefinido en el navegador. 15s cubre las operaciones normales;
  // el chat (LLM) usa 30s explícitos en su llamada.
  timeout: 15000,
});

// La cookie "token" viaja automáticamente en cada request del mismo origen,
// así que ya no hace falta un interceptor que la agregue manualmente.

// Interceptor de respuesta: si el token expiró o es inválido (401/403 sin
// body), la sesión terminó — se va directo a /login. NO a "/": la raíz
// redirige a /dashboard mientras la cookie "session" exista (page.tsx),
// y con el JWT vencido pero la cookie viva eso produce un loop infinito
// /dashboard ↔ / (hallazgo B-06, verificado en el e2e de expiración).
// El query param "sesion=expirada" hace que /login explique el motivo
// (la página muestra "Tu sesión expiró") — hallazgo B-06: explicar la
// acción perdida, no dejar al usuario sin contexto.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (sesionTerminada(error) && typeof window !== "undefined") {
      window.location.href = "/login?sesion=expirada";
    }
    return Promise.reject(error);
  }
);

export default api;
