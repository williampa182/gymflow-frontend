import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

vi.mock("@/lib/useRequireRole", () => ({
  useRequireRole: vi.fn(() => true),
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
import RecepcionPage from "./page";

// La página usa useToast(); el provider + host son requisito del árbol
// (viven en el layout del dashboard en producción).
function renderRecepcion() {
  return render(
    <ToastProvider>
      <RecepcionPage />
      <ToastHost />
    </ToastProvider>
  );
}

// Fecha local "YYYY-MM-DD" a N días de hoy (NUNCA UTC).
function isoLocalDias(desdeHoy: number): string {
  const f = new Date();
  f.setDate(f.getDate() + desdeHoy);
  const y = f.getFullYear();
  const m = String(f.getMonth() + 1).padStart(2, "0");
  const d = String(f.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const SOCIO = {
  id: 7,
  nombre: "Carlos Pérez",
  email: "carlos@example.com",
  rol: "CLIENTE" as const,
  activo: true,
  tipoDocumento: "CC",
  numeroDocumento: "123",
  telefono: "3001234567",
  creadoEn: "2026-01-01T10:00:00",
};

function suscripcion(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    usuarioId: SOCIO.id,
    nombreUsuario: SOCIO.nombre,
    planId: 1,
    nombrePlan: "Plan Mensual",
    fechaInicio: isoLocalDias(-20),
    fechaFin: isoLocalDias(30),
    estado: "ACTIVA" as const,
    creadoEn: "2026-01-01T10:00:00",
    ...overrides,
  };
}

function mockBusqueda(subs: ReturnType<typeof suscripcion>[]) {
  vi.mocked(api.get).mockImplementation((url) => {
    if (url === "/usuarios/por-documento") return Promise.resolve({ data: SOCIO });
    if (url === `/suscripciones/usuario/${SOCIO.id}`) {
      return Promise.resolve({ data: { content: subs } });
    }
    return Promise.reject(new Error(`GET no mockeado: ${url}`));
  });
}

async function buscarSocio() {
  fireEvent.change(screen.getByLabelText("Número de documento"), {
    target: { value: "123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  await screen.findByText("Carlos Pérez");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("dashboard/recepcion/page.tsx", () => {
  it("busca por documento y muestra el semáforo verde cuando faltan más de 7 días", async () => {
    mockBusqueda([suscripcion({ estado: "ACTIVA", fechaFin: isoLocalDias(30) })]);

    renderRecepcion();
    await buscarSocio();

    expect(api.get).toHaveBeenCalledWith("/usuarios/por-documento", {
      params: { tipo: "CC", numero: "123" },
    });
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText("Plan Mensual")).toBeInTheDocument();
    expect(screen.getByText("30 días restantes")).toBeInTheDocument();
  });

  it("muestra el semáforo amarillo cuando la membresía vence en 7 días o menos", async () => {
    mockBusqueda([suscripcion({ estado: "ACTIVA", fechaFin: isoLocalDias(5) })]);

    renderRecepcion();
    await buscarSocio();

    expect(screen.getByText("Por vencer")).toBeInTheDocument();
    expect(screen.getByText("5 días restantes")).toBeInTheDocument();
  });

  it("muestra el semáforo rojo cuando la membresía está vencida", async () => {
    mockBusqueda([suscripcion({ estado: "VENCIDA", fechaFin: isoLocalDias(-3) })]);

    renderRecepcion();
    await buscarSocio();

    expect(screen.getByText("Vencida")).toBeInTheDocument();
    expect(screen.getByText("Vencida hace 3 días")).toBeInTheDocument();
  });

  it("distingue cancelada de vencida en el semáforo", async () => {
    mockBusqueda([suscripcion({ estado: "CANCELADA", fechaFin: isoLocalDias(20) })]);

    renderRecepcion();
    await buscarSocio();

    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.queryByText("Vencida")).not.toBeInTheDocument();
  });

  it("muestra el badge neutral de congelada con su fecha", async () => {
    mockBusqueda([
      suscripcion({
        estado: "CONGELADA",
        fechaFin: isoLocalDias(20),
        congeladaDesde: isoLocalDias(-2),
      }),
    ]);

    renderRecepcion();
    await buscarSocio();

    expect(screen.getByText(/Congelada desde/)).toBeInTheDocument();
  });

  it("muestra el semáforo rojo sin membresía cuando el socio no tiene suscripciones", async () => {
    mockBusqueda([]);

    renderRecepcion();
    await buscarSocio();

    expect(screen.getByText("Sin membresía")).toBeInTheDocument();
    expect(screen.getByText("Sin plan")).toBeInTheDocument();
  });

  it("muestra el mensaje de no encontrado cuando el documento no existe (404)", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 404,
        data: { message: "No se encontró ningún socio con ese documento" },
      },
    });

    renderRecepcion();
    fireEvent.change(screen.getByLabelText("Número de documento"), {
      target: { value: "999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(
      await screen.findByText("No se encontró ningún socio con ese documento.")
    ).toBeInTheDocument();
  });

  it("registra la entrada con POST y avisa con un toast", async () => {
    mockBusqueda([suscripcion({ estado: "ACTIVA", fechaFin: isoLocalDias(30) })]);
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1 } });

    renderRecepcion();
    await buscarSocio();

    fireEvent.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/asistencias/admin/marcar", {
        usuarioId: SOCIO.id,
      });
    });
    expect(await screen.findByText("Entrada registrada.")).toBeInTheDocument();
  });
});
