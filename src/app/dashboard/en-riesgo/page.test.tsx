import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/lib/toast";
import { ToastHost } from "@/components/ToastHost";

vi.mock("@/lib/api", () => ({
  default: { get: vi.fn() },
}));

vi.mock("@/lib/auth", () => ({
  hasRole: vi.fn(() => true),
  getRol: vi.fn(() => "ADMIN"),
}));

vi.mock("@/lib/useRequireRole", () => ({
  useRequireRole: vi.fn(() => true),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard/en-riesgo",
}));

import api from "@/lib/api";
import EnRiesgoPage from "./page";

function renderEnRiesgo() {
  return render(
    <ToastProvider>
      <EnRiesgoPage />
      <ToastHost />
    </ToastProvider>
  );
}

const EN_RIESGO_MOCK = {
  porVencer: [
    {
      usuarioId: 1,
      nombre: "Ana García",
      nombrePlan: "Plan Mensual Básico",
      fechaFin: "2026-10-11",
      diasRestantes: 3,
      telefono: "300 111-2233",
    },
    {
      usuarioId: 2,
      nombre: "Beto López",
      nombrePlan: "Plan Full Access",
      fechaFin: "2026-10-09",
      diasRestantes: 1,
      telefono: null,
    },
  ],
  inactivos: [
    { usuarioId: 3, nombre: "Celi Ruiz", ultimaAsistencia: null, diasSinVenir: 30, telefono: "N/A" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(api.get).mockResolvedValue({ data: EN_RIESGO_MOCK });
});

describe("dashboard/en-riesgo/page.tsx", () => {
  it("lista por vencer e inactivos con sus conteos", async () => {
    renderEnRiesgo();

    expect(await screen.findByText("Por vencer (2)")).toBeInTheDocument();
    expect(screen.getByText("Inactivos (1)")).toBeInTheDocument();
    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("Celi Ruiz")).toBeInTheDocument();
  });

  it("el botón abre wa.me con el teléfono normalizado y el mensaje codificado", async () => {
    renderEnRiesgo();
    await screen.findByText("Ana García");

    const enlace = screen.getByRole("link", { name: /Escribir por WhatsApp/ });
    expect(enlace).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/573001112233?text=Hola%20Ana%20Garc%C3%ADa")
    );
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("sin teléfono muestra el fallback y no hay enlace", async () => {
    renderEnRiesgo();
    await screen.findByText("Beto López");

    expect(screen.getAllByText("Sin teléfono")).toHaveLength(2);
    const enlaces = screen.getAllByRole("link", { name: /Escribir por WhatsApp/ });
    expect(enlaces).toHaveLength(1);
  });

  it("teléfono inválido post-normalización también cae al fallback", async () => {
    renderEnRiesgo();
    await screen.findByText("Celi Ruiz");

    expect(screen.getByText("Nunca vino")).toBeInTheDocument();
    expect(screen.getAllByText("Sin teléfono")).toHaveLength(2);
  });

  it("muestra EmptyState cuando no hay nadie en riesgo", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { porVencer: [], inactivos: [] } });
    renderEnRiesgo();

    expect(await screen.findByText("Nadie por vencer esta semana.")).toBeInTheDocument();
    expect(screen.getByText("Nadie inactivo. Todo el mundo viene.")).toBeInTheDocument();
  });

  it("muestra error visible si el backend falla", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));
    renderEnRiesgo();

    expect(await screen.findByText("No se pudo cargar la lista en riesgo.")).toBeInTheDocument();
  });
});
