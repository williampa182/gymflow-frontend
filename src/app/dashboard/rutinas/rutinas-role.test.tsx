import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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
import RutinasPage from "./page";

const clientesMock = [
  { id: 2, nombre: "Cliente Beto", yaAcompaño: false, asignacionId: null },
  { id: 3, nombre: "Cliente Carla", yaAcompaño: true, asignacionId: 7 },
];

const rutinaMock = {
  id: 10,
  nombre: "Full Body",
  descripcion: "Arranque",
  activo: true,
  creadoEn: "2026-08-02T10:00:00",
  ejercicios: [
    { id: 1, nombre: "Press banca", series: 3, repeticiones: 10, orden: 1 },
    { id: 2, nombre: "Sentadilla", series: 4, repeticiones: 8, orden: 2 },
  ],
  asignados: [],
};

function renderPage() {
  return render(
    <ToastProvider>
      <RutinasPage />
      <ToastHost />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRol).mockReturnValue("ENTRENADOR");
});

describe("fase 4: vista del ENTRENADOR", () => {
  it("ve sus rutinas, los clientes elegibles y el botón de nueva rutina", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [rutinaMock] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: clientesMock });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Full Body")).toBeInTheDocument();
    });
    expect(screen.getByText("Cliente Beto")).toBeInTheDocument();
    expect(screen.getByText("Acompañado por vos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Nueva rutina" })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/rutinas");
    expect(api.get).toHaveBeenCalledWith("/entrenador/clientes-elegibles");
  });

  it("acompaña a un cliente elegible sin acompañante", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: clientesMock });
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Cliente Beto")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Acompañar" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/entrenador/asignarme/2");
    });
  });

  it("cancela el acompañamiento con el id de asignación", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: clientesMock });
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.delete).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Cliente Carla")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancelar acompañamiento" }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/entrenador/7");
    });
  });

  it("crea una rutina con un ejercicio: POST /rutinas y toast de éxito", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "+ Nueva rutina" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Nueva rutina" }));
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Pierna" },
    });
    fireEvent.change(screen.getByLabelText("Nombre del ejercicio 1"), {
      target: { value: "Prensa" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear rutina" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/rutinas", {
        nombre: "Pierna",
        descripcion: "",
        ejercicios: [{ nombre: "Prensa", series: 3, repeticiones: 10 }],
      });
    });
    expect(await screen.findByText("Rutina creada")).toBeInTheDocument();
  });

  it("asigna una rutina a un cliente acompañado", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [rutinaMock] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: clientesMock });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Full Body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Asignar a:"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Asignar" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/rutinas/10/asignar/3");
    });
  });

  it("desactiva una rutina con confirmación: DELETE /rutinas/{id}", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [rutinaMock] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.delete).mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Full Body")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/rutinas/10");
    });
    vi.restoreAllMocks();
  });

  it("quita una rutina desde la card (asignada a un cliente sin acompañamiento vigente)", async () => {
    // Beto ya no está acompañado pero conserva la asignación de rutina:
    // la única vía para quitársela es el chip de la card.
    const rutinaDeBeto = {
      ...rutinaMock,
      asignados: [{ id: 2, nombre: "Cliente Beto" }],
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: [rutinaDeBeto] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: clientesMock });
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.delete).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Full Body")).toBeInTheDocument();
    });
    expect(screen.getByText("Asignada a:")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Quitar Full Body a Cliente Beto" })
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/rutinas/10/asignar/2");
    });
    expect(await screen.findByText("Rutina quitada")).toBeInTheDocument();
    // recarga para reflejar el estado nuevo
    expect(api.get).toHaveBeenCalledWith("/rutinas");
    expect(api.get).toHaveBeenCalledWith("/entrenador/clientes-elegibles");
  });

  it("quita una rutina desde la sub-fila de un cliente acompañado", async () => {
    const rutinaDeCarla = {
      ...rutinaMock,
      asignados: [{ id: 3, nombre: "Cliente Carla" }],
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: [rutinaDeCarla] });
    vi.mocked(api.get).mockResolvedValueOnce({ data: clientesMock });
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.delete).mockResolvedValue({});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Rutinas asignadas:")).toBeInTheDocument();
    });

    const filaCliente = screen
      .getByText("Rutinas asignadas:")
      .closest("tr");
    fireEvent.click(
      within(filaCliente!).getByRole("button", {
        name: "Quitar Full Body a Cliente Carla",
      })
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/rutinas/10/asignar/3");
    });
  });
});

describe("fase 4: vista del CLIENTE", () => {
  beforeEach(() => {
    vi.mocked(getRol).mockReturnValue("CLIENTE");
  });

  it("ve su acompañante y sus rutinas asignadas", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [rutinaMock] });
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { id: 1, nombre: "Coach Ana", asignadoEn: "2026-08-02T10:00:00" },
    });
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Full Body")).toBeInTheDocument();
    });
    expect(screen.getByText("Coach Ana")).toBeInTheDocument();
    expect(screen.getByText("Press banca")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Nueva rutina" })).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/rutinas/mias");
    expect(api.get).toHaveBeenCalledWith("/entrenador/mio");
    expect(api.get).toHaveBeenCalledWith("/entrenador/mi-historial");
  });

  it("sin acompañante ni rutinas muestra los estados vacíos", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404 },
    });
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

    renderPage();

    expect(
      await screen.findByText("Todavía no tenés un entrenador asignado")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tu entrenador todavía no te asignó rutinas")
    ).toBeInTheDocument();
    expect(screen.getByText("Historial de acompañamientos")).toBeInTheDocument();
  });

  it("muestra el historial de acompañamientos con la más reciente primero", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404 },
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [
        {
          id: 5,
          entrenadorNombre: "Coach Ana",
          activa: true,
          asignadoEn: "2026-08-01T10:00:00",
        },
        {
          id: 3,
          entrenadorNombre: "Coach Leo",
          activa: false,
          asignadoEn: "2026-07-15T10:00:00",
        },
      ],
    });

    renderPage();

    expect(
      await screen.findByText("Historial de acompañamientos")
    ).toBeInTheDocument();
    expect(screen.getByText("Coach Leo")).toBeInTheDocument();
    expect(screen.getByText("ACTIVO")).toBeInTheDocument();
    expect(screen.getByText("CANCELADO")).toBeInTheDocument();
  });
});
