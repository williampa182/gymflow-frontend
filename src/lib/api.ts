import axios from "axios";

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

// Interceptor de respuesta: si el token expiró o es inválido (401),
// la sesión terminó — vuelve a la página principal (mismo criterio que
// el logout explícito en auth.ts).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
