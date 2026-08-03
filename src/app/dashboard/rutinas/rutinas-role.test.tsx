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

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Full Body")).toBeInTheDocument();
    });
    expect(screen.getByText("Coach Ana")).toBeInTheDocument();
    expect(screen.getByText("Press banca")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Nueva rutina" })).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/rutinas/mias");
    expect(api.get).toHaveBeenCalledWith("/entrenador/mio");
  });

  it("sin acompañante ni rutinas muestra los estados vacíos", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404 },
    });

    renderPage();

    expect(
      await screen.findByText("Todavía no tenés un entrenador asignado")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tu entrenador todavía no te asignó rutinas")
    ).toBeInTheDocument();
  });
});
