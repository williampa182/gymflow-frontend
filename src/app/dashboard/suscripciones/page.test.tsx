import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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
import SuscripcionesPage from "./page";

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

const SUSCRIPCIONES_MOCK = [
  {
    id: 1,
    usuarioId: 10,
    nombreUsuario: "Ana García",
    planId: 1,
    nombrePlan: "Plan Mensual Básico",
    fechaInicio: "2026-07-01",
    fechaFin: "2026-07-31",
    estado: "ACTIVA" as const,
    creadoEn: "2026-07-01T10:00:00",
  },
  {
    id: 2,
    usuarioId: 20,
    nombreUsuario: "Bruno López",
    planId: 2,
    nombrePlan: "Plan Anual Premium",
    fechaInicio: "2026-01-01",
    fechaFin: "2026-01-01",
    estado: "VENCIDA" as const,
    creadoEn: "2026-01-01T10:00:00",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("dashboard/suscripciones/page.tsx", () => {
  it("renderiza la lista de suscripciones cuando el backend devuelve Page<SuscripcionResponseDTO>", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(SUSCRIPCIONES_MOCK));

    render(<SuscripcionesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeInTheDocument();
    });
    expect(screen.getByText("Bruno López")).toBeInTheDocument();
    expect(screen.getByText("Plan Mensual Básico")).toBeInTheDocument();
    expect(screen.getByText("Plan Anual Premium")).toBeInTheDocument();
  });

  it("PREVENCIÓN DE REGRESIÓN: detecta si alguien rompe el contrato Page<T>", async () => {
    // ─── Qué previene este test ───────────────────────────────────
    // El 13/07 la página de suscripciones se rompió en DOS lugares por el
    // cambio a Page<T>:
    //   1. La lista principal (res.data.content)
    //   2. El formulario de creación (también carga /usuarios y /planes,
    //      ambos ahora Page<T>)
    //
    // Este test cubre el lugar #1. Si el código vuelve a hacer res.data.map,
    // crashea con TypeError y este test falla en rojo.
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(SUSCRIPCIONES_MOCK));

    render(<SuscripcionesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeInTheDocument();
      expect(screen.getByText("Bruno López")).toBeInTheDocument();
    });
  });

  it("maneja respuesta vacía sin crashear", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

    render(<SuscripcionesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No hay suscripciones con ese filtro.")
      ).toBeInTheDocument();
    });
  });

  it("muestra mensaje de error si el backend falla", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

    render(<SuscripcionesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar las suscripciones.")
      ).toBeInTheDocument();
    });
  });
});
