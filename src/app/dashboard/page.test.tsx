import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ToastHost } from "@/components/ToastHost";
import { ToastProvider } from "@/lib/toast";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  getRol: vi.fn(),
}));

vi.mock("@/lib/useRequireRole", () => ({
  useRequireRole: vi.fn(() => true),
}));

vi.mock("./_components/AdminDashboardCharts", () => ({
  default: () => <div data-testid="charts-stub">[charts]</div>,
}));

import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import { useRequireRole } from "@/lib/useRequireRole";
import DashboardPage from "./page";

function pageTotal(totalElements: number) {
  return {
    data: {
      content: [],
      totalElements,
    },
  };
}

function adminStats() {
  return {
    data: {
      usuariosPorRol: [
        { rol: "ADMIN" as const, cantidad: 1 },
        { rol: "ENTRENADOR" as const, cantidad: 4 },
        { rol: "CLIENTE" as const, cantidad: 7 },
      ],
      ingresosPorTipoPlan: [
        { tipoPlan: "MENSUAL" as const, ingresoEstimado: 100000, cantidadSuscripciones: 3 },
        { tipoPlan: "TRIMESTRAL" as const, ingresoEstimado: 200000, cantidadSuscripciones: 2 },
        { tipoPlan: "SEMESTRAL" as const, ingresoEstimado: 300000, cantidadSuscripciones: 2 },
        { tipoPlan: "ANUAL" as const, ingresoEstimado: 0, cantidadSuscripciones: 0 },
      ],
      suscripcionesPorEstado: [
        { estado: "ACTIVA" as const, cantidad: 7 },
        { estado: "VENCIDA" as const, cantidad: 1 },
        { estado: "CANCELADA" as const, cantidad: 1 },
      ],
    },
  };
}

function ownSubscriptionsPage(content: unknown[]) {
  return {
    data: {
      content,
      totalElements: content.length,
    },
  };
}

const subscription = {
  id: 10,
  usuarioId: 4,
  nombreUsuario: "Cliente GymFlow",
  planId: 1,
  nombrePlan: "Plan Mensual",
  fechaInicio: "2026-07-13",
  fechaFin: "2026-08-12",
  estado: "ACTIVA" as const,
  creadoEn: "2026-07-13T10:00:00",
};

const semanaVacia = {
  data: {
    fechaDesde: "2026-08-03",
    fechaHasta: "2026-08-09",
    total: 0,
    asistencias: [],
  },
};

const acompanadosVacios = { data: [] };

const carnetCliente = Promise.resolve({ data: { codigoCarnet: "ABCDEF1" } });

function renderDashboard() {
  return render(
    <ToastProvider>
      <DashboardPage />
      <ToastHost />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("dashboard ADMIN", () => {
  beforeEach(() => {
    vi.mocked(getRol).mockReturnValue("ADMIN");
  });

  it("muestra PageHeader dinámico y las cuatro estadísticas reales", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(pageTotal(5))
      .mockResolvedValueOnce(adminStats());

    renderDashboard();

    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Usuarios activos")).toBeInTheDocument();
    }, { timeout: 2500 });

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("$ 600.000")).toBeInTheDocument();
  });

  it("muestra charts y accesos rápidos ADMIN", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(pageTotal(5))
      .mockResolvedValueOnce(adminStats());

    renderDashboard();

    await waitFor(() => expect(screen.getByTestId("charts-stub")).toBeInTheDocument(), {
      timeout: 2500,
    });

    expect(screen.getByRole("link", { name: "Gestionar planes" })).toHaveAttribute(
      "href",
      "/dashboard/planes"
    );
    expect(screen.getByRole("link", { name: "Gestionar suscripciones" })).toHaveAttribute(
      "href",
      "/dashboard/suscripciones"
    );
    expect(screen.getByRole("link", { name: "Gestionar usuarios" })).toHaveAttribute(
      "href",
      "/dashboard/usuarios"
    );
  });
});

describe("dashboard CLIENTE y ENTRENADOR", () => {
  it("CLIENTE ve su plan, vencimiento, estado vacío de asistencias y no solicita datos ADMIN", async () => {
    vi.mocked(getRol).mockReturnValue("CLIENTE");
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === "/suscripciones/mis") return ownSubscriptionsPage([subscription]) as never;
      if (url === "/asistencias/mi/semana") return semanaVacia as never;
      if (url === "/asistencias/mi/carnet") return carnetCliente as never;
      return Promise.reject(new Error(`URL inesperada: ${url}`));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Panel del cliente")).toBeInTheDocument();
      expect(screen.getByText("Plan Mensual")).toBeInTheDocument();
      expect(screen.getByText("11/8/2026")).toBeInTheDocument();
    }, { timeout: 2500 });

    await waitFor(() => {
      expect(screen.getByText("Asistencias esta semana")).toBeInTheDocument();
      expect(screen.getByText("Todavía no hay registros de asistencia esta semana.")).toBeInTheDocument();
      expect(screen.getByText("Mi carnet")).toBeInTheDocument();
    }, { timeout: 2500 });
    expect(screen.getByRole("link", { name: "Ver mis suscripciones" })).toHaveAttribute(
      "href",
      "/dashboard/suscripciones"
    );
    expect(screen.queryByText("Ingresos estimados")).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/suscripciones/mis");
    expect(api.get).toHaveBeenCalledWith("/asistencias/mi/semana");
    expect(api.get).not.toHaveBeenCalledWith("/dashboard/admin/estadisticas");
  });

  it("ENTRENADOR muestra un encabezado propio y EmptyState si no tiene plan", async () => {
    vi.mocked(getRol).mockReturnValue("ENTRENADOR");
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === "/suscripciones/mis") return ownSubscriptionsPage([]) as never;
      if (url === "/asistencias/acompanados/semana") return acompanadosVacios as never;
      return Promise.reject(new Error(`URL inesperada: ${url}`));
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Panel del entrenador")).toBeInTheDocument();
      expect(screen.getByText("No tienes un plan activo.")).toBeInTheDocument();
      expect(screen.getByText("Todavía no tienes clientes acompañados.")).toBeInTheDocument();
    }, { timeout: 2500 });
  });
});

describe("dashboard: guard y errores", () => {
  it("usa el guard para los tres roles permitidos", async () => {
    vi.mocked(getRol).mockReturnValue("CLIENTE");
    vi.mocked(api.get).mockResolvedValueOnce(ownSubscriptionsPage([]));

    renderDashboard();

    await waitFor(() => expect(screen.getByText("Panel del cliente")).toBeInTheDocument(), {
      timeout: 2500,
    });
    expect(useRequireRole).toHaveBeenCalledWith(
      ["ADMIN", "CLIENTE", "ENTRENADOR"],
      "/login"
    );
  });

  it("muestra banner y toast si falla la carga", async () => {
    vi.mocked(getRol).mockReturnValue("ADMIN");
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(adminStats());

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("No se pudieron cargar las estadísticas.")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "No se pudieron cargar las estadísticas."
      );
    }, { timeout: 2500 });
  });
});
