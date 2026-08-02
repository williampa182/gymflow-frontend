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
import SuscripcionesPage from "./page";

function pageResponse<T>(content: T[]) {
  return { data: { content, totalElements: content.length } };
}

const subscription = {
  id: 1,
  usuarioId: 7,
  nombreUsuario: "Cliente",
  planId: 1,
  nombrePlan: "Plan Mensual",
  fechaInicio: "2026-07-01",
  fechaFin: "2026-07-31",
  estado: "ACTIVA" as const,
  creadoEn: "2026-07-01T10:00:00",
};

function renderPage() {
  return render(
    <ToastProvider>
      <SuscripcionesPage />
      <ToastHost />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRol).mockReturnValue("CLIENTE");
});

describe("suscripciones propias para roles no ADMIN", () => {
  it("CLIENTE consulta solo sus suscripciones y no ve acciones de gestión", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([subscription]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Plan Mensual")).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith("/suscripciones/mis");
    expect(screen.queryByRole("button", { name: /Nueva/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    expect(useRequireRole).toHaveBeenCalledWith(
      ["ADMIN", "CLIENTE", "ENTRENADOR"],
      "/dashboard"
    );
  });

  it("ENTRENADOR ve EmptyState cuando no tiene suscripciones propias", async () => {
    vi.mocked(getRol).mockReturnValue("ENTRENADOR");
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/No tienes suscripciones registradas/)).toBeInTheDocument();
    });
    expect(api.get).toHaveBeenCalledWith("/suscripciones/mis");
  });
});
