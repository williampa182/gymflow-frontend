import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/lib/toast";
import { ToastHost } from "@/components/ToastHost";

// ─── Mocks ─────────────────────────────────────────────────────────
// Mockeamos `@/lib/api` (instancia axios) para que `api.get` devuelva lo
// que decidamos en cada test, sin tocar red. El contrato que afirmamos
// aquí es el que el backend Spring realmente devuelve (verificación del
// `PlanController.listar()` → `ResponseEntity<Page<PlanResponseDTO>>`).
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

vi.mock("@/lib/auth", () => ({
  getRol: vi.fn(),
}));

import api from "@/lib/api";
import { getRol } from "@/lib/auth";
import { useRequireRole } from "@/lib/useRequireRole";
import PlanesPage from "./page";

// La página usa useToast(); el provider + host son requisito del árbol
// (viven en el layout del dashboard en producción).
function renderPlanes() {
  return render(
    <ToastProvider>
      <PlanesPage />
      <ToastHost />
    </ToastProvider>
  );
}

// ─── Helpers: shape real del Page<T> de Spring Data ─────────────────
// Spring serializa `Page<T>` exactamente con esta forma. Traemos todos
// los campos relevantes para que el test documente el contrato completo.
function pageResponse<T>(content: T[], totalElements = content.length) {
  return {
    data: {
      content,
      pageable: {
        pageNumber: 0,
        pageSize: 20,
        sort: { sorted: false, unsorted: true, empty: true },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      totalElements,
      totalPages: Math.max(1, Math.ceil(totalElements / 20)),
      last: true,
      first: true,
      size: 20,
      number: 0,
      sort: { sorted: false, unsorted: true, empty: true },
      numberOfElements: content.length,
      empty: content.length === 0,
    },
  };
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

beforeEach(() => {
  vi.clearAllMocks();
  // La suite existente ejercita el flujo ADMIN: la vista de gestión completa.
  vi.mocked(getRol).mockReturnValue("ADMIN");
  // Silenciamos console.error del componente durante los tests de "backend
  // falla", para no ensuciar la salida. Si el test rompe, vitest igual lo
  // muestra.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("dashboard/planes/page.tsx", () => {
  it("renderiza la lista de planes cuando el backend devuelve Page<PlanResponseDTO>", async () => {
    // Contrato actual (post-3.3): Spring Data Page<T>, array en `.content`.
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(plansMock));

    renderPlanes();

    await waitFor(() => {
      expect(screen.getByText("Plan Mensual Básico")).toBeInTheDocument();
    });
    expect(screen.getByText("Plan Anual Premium")).toBeInTheDocument();
  });

  it("PREVENCIÓN DE REGRESIÓN: detecta si alguien rompe el contrato Page<T>", async () => {
    // ─── Qué previene este test ───────────────────────────────────
    // El 13/07 el frontend se rompió en producción porque el backend pasó
    // de devolver `PlanResponseDTO[]` (array plano) a `Page<PlanResponseDTO>`
    // (objeto con `.content`), y las páginas hacían `res.data.map(...)`
    // directo → "planes.map is not a function".
    //
    // Este test mockea el backend con el shape Page<T> actual. Si el código
    // de la página se rompe y vuelve a tratar la respuesta como array plano
    // (es decir, deja de leer `.content`), el `.map` interno se cae con
    // TypeError antes de renderizar, y este test falla en rojo.
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(plansMock));

    renderPlanes();

    // El assert real: los nombres de planes deben aparecer en el DOM, lo que
    // solo es posible si el código leyó `.content` correctamente.
    await waitFor(() => {
      expect(screen.getByText("Plan Mensual Básico")).toBeInTheDocument();
      expect(screen.getByText("Plan Anual Premium")).toBeInTheDocument();
    });
  });

  it("maneja respuesta vacía sin crashear", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

    renderPlanes();

    await waitFor(() => {
      expect(
        screen.getByText("No hay planes registrados todavía.")
      ).toBeInTheDocument();
    });
  });

  it("muestra mensaje de error si el backend falla", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

    renderPlanes();

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar los planes.")
      ).toBeInTheDocument();
    });
  });

  describe("acciones de admin", () => {
    it("deshabilita el toggle mientras corre el PATCH y evita el doble disparo", async () => {
      vi.mocked(api.get).mockResolvedValue(pageResponse(plansMock));
      // PATCH que nunca resuelve: el botón queda en estado pendiente.
      vi.mocked(api.patch).mockReturnValue(new Promise(() => {}));

      renderPlanes();

      const botones = await screen.findAllByRole("button", { name: "Desactivar" });
      const boton = botones[0];
      fireEvent.click(boton);
      fireEvent.click(screen.getByRole("button", { name: "¿Seguro?" }));

      expect(api.patch).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "..." })).toBeDisabled();
    });

    it("avisa con un toast cuando se desactiva un plan", async () => {
      vi.mocked(api.get).mockResolvedValue(pageResponse(plansMock));
      vi.mocked(api.patch).mockResolvedValue({ data: {} });

      renderPlanes();

      const botones = await screen.findAllByRole("button", { name: "Desactivar" });
      fireEvent.click(botones[0]);
      fireEvent.click(screen.getByRole("button", { name: "¿Seguro?" }));

      await waitFor(() => {
        expect(screen.getByText("Plan desactivado.")).toBeInTheDocument();
      });
    });

    it("exige confirmación de dos pasos para desactivar", async () => {
      vi.mocked(api.get).mockResolvedValue(pageResponse(plansMock));
      vi.mocked(api.patch).mockResolvedValue({ data: {} });

      renderPlanes();

      const boton = await screen.findAllByRole("button", { name: "Desactivar" });
      fireEvent.click(boton[0]);

      expect(api.patch).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "¿Seguro?" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "¿Seguro?" }));

      await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    });

    it("muestra aria-invalid en los campos obligatorios del modal", async () => {
      vi.mocked(api.get).mockResolvedValue(pageResponse(plansMock));

      renderPlanes();
      fireEvent.click(await screen.findByRole("button", { name: "+ Nuevo plan" }));
      fireEvent.change(screen.getByLabelText("Duración (días)"), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

      expect(await screen.findByLabelText("Nombre")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText("Precio")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText("Duración (días)")).toHaveAttribute("aria-invalid", "true");
    });

    it("exige el guard para los tres roles permitidos sin redirigir al dashboard", () => {
      vi.mocked(api.get).mockResolvedValue(pageResponse([]));
      renderPlanes();
      expect(useRequireRole).toHaveBeenCalledWith(
        ["ADMIN", "CLIENTE", "ENTRENADOR"],
        "/dashboard"
      );
    });
  });
});
