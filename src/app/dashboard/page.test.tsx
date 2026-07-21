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

// getRol se mockea a nivel módulo; cada test lo ajusta con mockReturnValue.
vi.mock("@/lib/auth", () => ({
  getRol: vi.fn(),
}));

// Mockeamos AdminDashboardCharts como stub para aislar el test de Recharts
// (que require jsdom + SVG y agrega ruido). Nos importa el gate de rol, no
// el render interno de los gráficos.
vi.mock("./_components/AdminDashboardCharts", () => ({
  default: () => <div data-testid="charts-stub">[charts]</div>,
}));

import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import DashboardPage from "./page";

// ─── Helpers: shape real del Page<T> de Spring Data ─────────────────
// El dashboard SOLO lee `.totalElements` del Page — no usa `.content`. Pero
// mockeamos el shape completo para documentar el contrato real.
function pageTotal(totalElements: number) {
  return {
    data: {
      content: [],
      pageable: { pageNumber: 0, pageSize: 20, sort: {}, offset: 0 },
      totalElements,
      totalPages: 1,
      last: true,
      first: true,
      size: 20,
      number: 0,
      sort: {},
      numberOfElements: 0,
      empty: totalElements === 0,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("dashboard/page.tsx — rol ADMIN", () => {
  beforeEach(() => {
    vi.mocked(getRol).mockReturnValue("ADMIN");
  });

  it("renderiza los tres PlateStat con totalElements cuando el backend devuelve Page<T>", async () => {
    // /planes?activo=true → totalElements 5
    vi.mocked(api.get)
      .mockResolvedValueOnce(pageTotal(5)) // /planes?activo=true
      .mockResolvedValueOnce(pageTotal(12)) // /usuarios
      .mockResolvedValueOnce(pageTotal(7)); // /suscripciones?estado=ACTIVA

    render(<DashboardPage />);

    // Los 3 números deben aparecer en el DOM como texto del PlateStat.
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();

    // Los labels también
    expect(screen.getByText("Planes activos")).toBeInTheDocument();
    expect(screen.getByText("Usuarios registrados")).toBeInTheDocument();
    expect(screen.getByText("Suscripciones activas")).toBeInTheDocument();
  });

  it("PREVENCIÓN DE REGRESIÓN: detecta si alguien rompe el contrato Page<T>", async () => {
    // El 13/07 este dashboard se rompió en silencio: como la página usaba
    // `.data.length` (que sobre un objeto Page devuelve undefined), los
    // PlateStat quedaban vacíos SIN crashear — más peligroso que un error
    // visible. Hoy la página usa `.totalElements`. Si alguien revierte eso,
    // los números NO aparecerían en el DOM y este test fallaría en rojo.
    vi.mocked(api.get)
      .mockResolvedValueOnce(pageTotal(5))
      .mockResolvedValueOnce(pageTotal(12))
      .mockResolvedValueOnce(pageTotal(7));

    render(<DashboardPage />);

    await waitFor(() => {
      // Si se rompe el contrato, esto falla porque el número no se renderiza.
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  it("muestra AdminDashboardCharts solo para ADMIN", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(pageTotal(5))
      .mockResolvedValueOnce(pageTotal(12))
      .mockResolvedValueOnce(pageTotal(7));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("charts-stub")).toBeInTheDocument();
    });
  });
});

describe("dashboard/page.tsx — rol CLIENTE (no-ADMIN)", () => {
  beforeEach(() => {
    vi.mocked(getRol).mockReturnValue("CLIENTE");
  });

  it("muestra 'N/A' en los PlateStat restringidos y NO llama a /usuarios ni /suscripciones", async () => {
    // CLIENTE: solo se llama a /planes?activo=true. Los otros dos no.
    vi.mocked(api.get).mockResolvedValueOnce(pageTotal(5));

    render(<DashboardPage />);

    // Planes activos: visible (CLIENTE sí lo ve)
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    // Los restringidos muestran "N/A" y "Solo visible para ADMIN"
    expect(screen.getAllByText("N/A")).toHaveLength(2);
    expect(
      screen.getAllByText("Solo visible para ADMIN")
    ).toHaveLength(2);

    // Solo 1 llamada a api.get (la de /planes). No se llaman /usuarios ni
    // /suscripciones — confirmación de que el gate es efectivo.
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("NO renderiza AdminDashboardCharts para CLIENTE", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageTotal(5));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    // El gate {getRol() === "ADMIN" && <AdminDashboardCharts />} debe
    // excluir a CLIENTE.
    expect(screen.queryByTestId("charts-stub")).not.toBeInTheDocument();
  });
});

describe("dashboard/page.tsx — manejo de errores", () => {
  beforeEach(() => {
    vi.mocked(getRol).mockReturnValue("ADMIN");
  });

  it("muestra mensaje de error si el backend falla", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar las estadísticas.")
      ).toBeInTheDocument();
    });
  });
});
