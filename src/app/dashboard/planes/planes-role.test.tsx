import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ToastHost } from "@/components/ToastHost";
import { ToastProvider } from "@/lib/toast";

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
  getRol: vi.fn(),
}));

vi.mock("@/lib/useRequireRole", () => ({
  useRequireRole: vi.fn(() => true),
}));

import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import { useRequireRole } from "@/lib/useRequireRole";
import PlanesPage from "./page";

function pageResponse<T>(content: T[]) {
  return { data: { content, totalElements: content.length } };
}

const plansMock = [
  {
    id: 1,
    nombre: "Plan Mensual Básico",
    descripcion: "Acceso general al gimnasio",
    precio: 25000,
    duracionDias: 30,
    tipo: "MENSUAL" as const,
    limiteClases: 0,
    incluyeClases: false,
    incluyeEntrenadorPersonal: false,
    activo: true,
    creadoEn: "2026-06-01T10:00:00",
  },
  {
    id: 2,
    nombre: "Plan Anual Premium",
    descripcion: "Todo incluido",
    precio: 280000,
    duracionDias: 365,
    tipo: "ANUAL" as const,
    limiteClases: 0,
    incluyeClases: true,
    incluyeEntrenadorPersonal: true,
    activo: true,
    creadoEn: "2026-06-02T11:00:00",
  },
];

function renderPage() {
  return render(
    <ToastProvider>
      <PlanesPage />
      <ToastHost />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRol).mockReturnValue("CLIENTE");
});

describe("planes en modo solo lectura para roles no ADMIN", () => {
  it("CLIENTE ve solo planes activos sin acciones de gestión", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(plansMock));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Plan Mensual Básico")).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith("/planes", { params: { activo: true } });
    expect(screen.getByText("Planes disponibles")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Nuevo plan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();
    expect(useRequireRole).toHaveBeenCalledWith(
      ["ADMIN", "CLIENTE", "ENTRENADOR"],
      "/dashboard"
    );
  });

  it("CLIENTE filtra cualquier plan inactivo que llegue del backend", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(
      pageResponse([
        ...plansMock,
        { ...plansMock[0], id: 3, nombre: "Plan Viejo", activo: false },
      ])
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Plan Mensual Básico")).toBeInTheDocument();
    });
    expect(screen.queryByText("Plan Viejo")).not.toBeInTheDocument();
  });

  it("ENTRENADOR ve EmptyState cuando no hay planes activos", async () => {
    vi.mocked(getRol).mockReturnValue("ENTRENADOR");
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("No hay planes activos disponibles.")
      ).toBeInTheDocument();
    });
    expect(api.get).toHaveBeenCalledWith("/planes", { params: { activo: true } });
  });
});
