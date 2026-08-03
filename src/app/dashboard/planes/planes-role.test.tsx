import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Plan Mensual Básico")).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith("/planes", { params: { activo: true } });
    expect(api.get).toHaveBeenCalledWith("/suscripciones/mis");
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
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

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
    expect(api.get).not.toHaveBeenCalledWith("/suscripciones/mis");
    expect(screen.queryByRole("button", { name: "Inscribirme" })).not.toBeInTheDocument();
  });
});

describe("fase 3: auto-suscripción del CLIENTE", () => {
  it("CLIENTE sin membresía ve un botón Inscribirme por plan", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(plansMock));
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Plan Mensual Básico")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("button", { name: "Inscribirme" })).toHaveLength(2);
    expect(screen.queryByText("Ya sos miembro")).not.toBeInTheDocument();
  });

  it("CLIENTE que ya es miembro ve el badge y no el botón", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(plansMock));
    vi.mocked(api.get).mockResolvedValueOnce(
      pageResponse([
        {
          id: 5,
          usuarioId: 10,
          nombreUsuario: "Ana García",
          planId: 1,
          nombrePlan: "Plan Mensual Básico",
          fechaInicio: "2026-08-01",
          fechaFin: "2026-08-31",
          estado: "ACTIVA",
          creadoEn: "2026-08-01T10:00:00",
        },
      ])
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Ya sos miembro")).toHaveLength(2);
    });
    expect(screen.queryByRole("button", { name: "Inscribirme" })).not.toBeInTheDocument();
  });

  it("abre el modal y paga (demo): POST a /suscripciones/mi y toast de éxito", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(plansMock));
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));
    vi.mocked(api.post).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Inscribirme" })).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Inscribirme" })[0]);

    expect(
      screen.getByRole("dialog", { name: "Confirmar inscripción" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Plan Mensual Básico")).toHaveLength(2);

    const pagar = screen.getByRole("button", { name: /Pagar .*\(demo\)/ });
    fireEvent.click(pagar);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/suscripciones/mi", { planId: 1 });
    });
    expect(
      await screen.findByText("¡Listo! Ya sos miembro de Plan Mensual Básico.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByText("Ya sos miembro")).toHaveLength(2);
  });

  it("409 del backend (ya es miembro) muestra toast de error y el badge", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(plansMock));
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));
    vi.mocked(api.post).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: "El usuario ya tiene una suscripción activa" },
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Inscribirme" })).toHaveLength(2);
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Inscribirme" })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Pagar .*\(demo\)/ }));

    expect(
      await screen.findByText("El usuario ya tiene una suscripción activa")
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("Ya sos miembro")).toHaveLength(2);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
