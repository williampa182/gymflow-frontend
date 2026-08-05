import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastHost } from "@/components/ToastHost";
import { ToastProvider } from "@/lib/toast";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "@/lib/api";
import { AsistenciasSemanaCard } from "./AsistenciasSemanaCard";

const semanaVacia = {
  data: {
    fechaDesde: "2026-08-03",
    fechaHasta: "2026-08-09",
    total: 0,
    asistencias: [],
  },
};

const hoyBogota = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

function renderTarjeta(rol: "CLIENTE" | "ENTRENADOR") {
  return render(
    <ToastProvider>
      <AsistenciasSemanaCard rol={rol} />
      <ToastHost />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AsistenciasSemanaCard — CLIENTE", () => {
  it("muestra EmptyState y el botón habilitado si la semana está vacía", async () => {
    vi.mocked(api.get).mockResolvedValue(semanaVacia);

    renderTarjeta("CLIENTE");

    await waitFor(() =>
      expect(screen.getByText("Todavía no hay registros de asistencia esta semana.")).toBeInTheDocument()
    );
    const boton = screen.getByRole("button", { name: "Registrar entrada" });
    expect(boton).toBeEnabled();
    expect(api.get).toHaveBeenCalledWith("/asistencias/mi/semana");
  });

  it("deshabilita el botón con 'Ya marcaste hoy' si hay una asistencia hoy", async () => {
    const hoy = hoyBogota();
    vi.mocked(api.get).mockResolvedValue({
      data: {
        fechaDesde: "2026-08-03",
        fechaHasta: "2026-08-09",
        total: 1,
        asistencias: [
          {
            id: 7,
            usuarioId: 4,
            nombre: "Cliente Fase5",
            fecha: hoy,
            entradaEn: `${hoy}T08:15:00`,
            salidaEn: null,
            metodo: "SELF",
          },
        ],
      },
    });

    renderTarjeta("CLIENTE");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Ya marcaste hoy" })).toBeDisabled()
    );
    expect(screen.getByText("App")).toBeInTheDocument();
  });

  it("POSTea /asistencias/mi y recarga la semana al registrar", async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.get).mockResolvedValue(semanaVacia);

    renderTarjeta("CLIENTE");

    await userEvent.click(await screen.findByRole("button", { name: "Registrar entrada" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/asistencias/mi"));
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});

describe("AsistenciasSemanaCard — ENTRENADOR", () => {
  it("muestra cada cliente acompañado con sus días", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          clienteId: 4,
          clienteNombre: "Cliente Fase5",
          asistencias: [
            { id: 7, usuarioId: 4, nombre: "Cliente Fase5", fecha: "2026-08-03", entradaEn: "2026-08-03T08:15:00", salidaEn: null, metodo: "SELF" },
            { id: 9, usuarioId: 4, nombre: "Cliente Fase5", fecha: "2026-08-04", entradaEn: "2026-08-04T07:45:00", salidaEn: null, metodo: "KIOSK_CARNET" },
          ],
        },
        {
          clienteId: 5,
          clienteNombre: "Cliente Sin Días",
          asistencias: [],
        },
      ],
    });

    renderTarjeta("ENTRENADOR");

    await waitFor(() => expect(screen.getByText("Cliente Fase5")).toBeInTheDocument());
    expect(screen.getByText("2 días")).toBeInTheDocument();
    expect(screen.getByText("Cliente Sin Días")).toBeInTheDocument();
    expect(screen.getByText("0 días")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/asistencias/acompanados/semana");
  });

  it("muestra EmptyState si no tiene acompañados", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    renderTarjeta("ENTRENADOR");

    await waitFor(() =>
      expect(screen.getByText("Todavía no tienes clientes acompañados.")).toBeInTheDocument()
    );
  });
});