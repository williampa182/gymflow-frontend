import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/lib/toast";
import { ToastHost } from "@/components/ToastHost";

// ─── Mocks ─────────────────────────────────────────────────────────
vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// La página de usuarios requiere rol ADMIN: si no lo es, redirige con
// router.replace("/dashboard"). Para testear el render de la lista mockeamos
// hasRole => true y el router (push/replace no-ops, solo seguimos el flujo).
vi.mock("@/lib/auth", () => ({
  hasRole: vi.fn(() => true),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
}));

import api from "@/lib/api";
import UsuariosPage from "./page";

// La página usa useToast(); el provider + host son requisito del árbol
// (viven en el layout del dashboard en producción).
function renderUsuarios() {
  return render(
    <ToastProvider>
      <UsuariosPage />
      <ToastHost />
    </ToastProvider>
  );
}

// ─── Helpers: shape real del Page<T> de Spring Data ─────────────────
function pageResponse<T>(content: T[], totalElements = content.length) {
  return {
    data: {
      content,
      pageable: {
        pageNumber: 0,
        pageSize: 20,
        sort: { sorted: false, unsorted: true, empty: true },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      totalElements,
      totalPages: Math.max(1, Math.ceil(totalElements / 20)),
      last: true,
      first: true,
      size: 20,
      number: 0,
      sort: { sorted: false, unsorted: true, empty: true },
      numberOfElements: content.length,
      empty: content.length === 0,
    },
  };
}

const USUARIOS_MOCK = [
  {
    id: 1,
    nombre: "Ana García",
    email: "ana@example.com",
    rol: "CLIENTE" as const,
    activo: true,
    creadoEn: "2026-05-10T09:30:00",
  },
  {
    id: 2,
    nombre: "Bruno López",
    email: "bruno@example.com",
    rol: "ENTRENADOR" as const,
    activo: true,
    creadoEn: "2026-05-12T14:00:00",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("dashboard/usuarios/page.tsx", () => {
  it("renderiza la lista de usuarios cuando el backend devuelve Page<UsuarioResponseDTO>", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(USUARIOS_MOCK));

    renderUsuarios();

    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeInTheDocument();
    });
    expect(screen.getByText("Bruno López")).toBeInTheDocument();
    // Emails también se renderizan (columna email)
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("PREVENCIÓN DE REGRESIÓN: detecta si alguien rompe el contrato Page<T>", async () => {
    // ─── Qué previene este test ───────────────────────────────────
    // El 13/07 el frontend se rompió en producción cuando el backend pasó
    // de devolver `UsuarioResponseDTO[]` (array) a `Page<UsuarioResponseDTO>`
    // (objeto con `.content`), y la página hacía `res.data.map(...)` directo.
    //
    // Si el código vuelve a tratar la respuesta como array (deja de leer
    // `.content`), `usuarios.map` => TypeError antes de renderizar, y este
    // test falla en rojo.
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(USUARIOS_MOCK));

    renderUsuarios();

    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeInTheDocument();
      expect(screen.getByText("Bruno López")).toBeInTheDocument();
    });
  });

  it("maneja respuesta vacía sin crashear", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

    renderUsuarios();

    await waitFor(() => {
      expect(
        screen.getByText("No hay usuarios con ese filtro.")
      ).toBeInTheDocument();
    });
  });

  it("muestra mensaje de error si el backend falla", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

    renderUsuarios();

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar los usuarios.")
      ).toBeInTheDocument();
    });
  });
});
