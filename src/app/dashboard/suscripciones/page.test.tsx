import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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

vi.mock("@/lib/auth", () => ({
  hasRole: vi.fn(() => true),
  getRol: vi.fn(),
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
import { getRol } from "@/lib/auth";
import SuscripcionesPage from "./page";

// La página usa useToast(); el provider + host son requisito del árbol
// (viven en el layout del dashboard en producción).
function renderSuscripciones() {
  return render(
    <ToastProvider>
      <SuscripcionesPage />
      <ToastHost />
    </ToastProvider>
  );
}

// ─── Helpers: shape real del Page<T> de Spring Data ─────────────────
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

const SUSCRIPCIONES_MOCK = [
  {
    id: 1,
    usuarioId: 10,
    nombreUsuario: "Ana García",
    planId: 1,
    nombrePlan: "Plan Mensual Básico",
    fechaInicio: "2026-07-01",
    fechaFin: "2026-07-31",
    estado: "ACTIVA" as const,
    creadoEn: "2026-07-01T10:00:00",
  },
  {
    id: 2,
    usuarioId: 20,
    nombreUsuario: "Bruno López",
    planId: 2,
    nombrePlan: "Plan Anual Premium",
    fechaInicio: "2026-01-01",
    fechaFin: "2026-01-01",
    estado: "VENCIDA" as const,
    creadoEn: "2026-01-01T10:00:00",
  },
];

const USUARIOS_MOCK = [
  {
    id: 10,
    nombre: "Ana García",
    email: "ana@example.com",
    rol: "CLIENTE" as const,
    activo: true,
    creadoEn: "2026-06-01T10:00:00",
  },
];

const PLANES_MOCK = [
  {
    id: 1,
    nombre: "Plan Mensual Básico",
    descripcion: "Acceso general",
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
    nombre: "Plan Inactivo",
    descripcion: "No disponible",
    precio: 10000,
    duracionDias: 30,
    tipo: "MENSUAL" as const,
    limiteClases: 0,
    incluyeClases: false,
    incluyeEntrenadorPersonal: false,
    activo: false,
    creadoEn: "2026-06-02T10:00:00",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRol).mockReturnValue("ADMIN");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("dashboard/suscripciones/page.tsx", () => {
  it("renderiza la lista de suscripciones cuando el backend devuelve Page<SuscripcionResponseDTO>", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(SUSCRIPCIONES_MOCK));

    renderSuscripciones();

    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeInTheDocument();
    });
    expect(screen.getByText("Bruno López")).toBeInTheDocument();
    expect(screen.getByText("Plan Mensual Básico")).toBeInTheDocument();
    expect(screen.getByText("Plan Anual Premium")).toBeInTheDocument();
  });

  it("PREVENCIÓN DE REGRESIÓN: detecta si alguien rompe el contrato Page<T>", async () => {
    // ─── Qué previene este test ───────────────────────────────────
    // El 13/07 la página de suscripciones se rompió en DOS lugares por el
    // cambio a Page<T>:
    //   1. La lista principal (res.data.content)
    //   2. El formulario de creación (también carga /usuarios y /planes,
    //      ambos ahora Page<T>)
    //
    // Este test cubre el lugar #1. Si el código vuelve a hacer res.data.map,
    // crashea con TypeError y este test falla en rojo.
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse(SUSCRIPCIONES_MOCK));

    renderSuscripciones();

    await waitFor(() => {
      expect(screen.getByText("Ana García")).toBeInTheDocument();
      expect(screen.getByText("Bruno López")).toBeInTheDocument();
    });
  });

  it("maneja respuesta vacía sin crashear", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(pageResponse([]));

    renderSuscripciones();

    await waitFor(() => {
      expect(
        screen.getByText("No hay suscripciones con ese filtro.")
      ).toBeInTheDocument();
    });
  });

  it("muestra mensaje de error si el backend falla", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

    renderSuscripciones();

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar las suscripciones.")
      ).toBeInTheDocument();
    });
  });

  describe("flujo de cancelación", () => {
    it("no cancela con el primer click: exige confirmación explícita", async () => {
      vi.mocked(api.get).mockResolvedValue(pageResponse(SUSCRIPCIONES_MOCK));
      vi.mocked(api.patch).mockResolvedValue({ data: {} });

      renderSuscripciones();

      const botonCancelar = await screen.findByRole("button", { name: "Cancelar" });
      fireEvent.click(botonCancelar);

      expect(api.patch).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      const dialogoCancelar = within(screen.getByRole("dialog")).getAllByRole(
        "button",
        { name: "Cancelar" }
      )[1];
      fireEvent.click(dialogoCancelar);

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith("/suscripciones/1/cancelar");
      });
    });

    it("avisa con un toast cuando la suscripción se cancela", async () => {
      vi.mocked(api.get).mockResolvedValue(pageResponse(SUSCRIPCIONES_MOCK));
      vi.mocked(api.patch).mockResolvedValue({ data: {} });

      renderSuscripciones();

      const botonCancelar = await screen.findByRole("button", { name: "Cancelar" });
      fireEvent.click(botonCancelar);
      fireEvent.click(
        within(screen.getByRole("dialog")).getAllByRole("button", {
          name: "Cancelar",
        })[1]
      );

      await waitFor(() => {
        expect(screen.getByText("Suscripción cancelada.")).toBeInTheDocument();
      });
    });
  });

  describe("modal de creación", () => {
    it("cierra con Escape (focus trap)", async () => {
      vi.mocked(api.get).mockResolvedValue(pageResponse(SUSCRIPCIONES_MOCK));

      renderSuscripciones();

      fireEvent.click(await screen.findByRole("button", { name: "+ Nueva suscripción" }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("valida que exista un plan activo antes de crear", async () => {
      vi.mocked(api.get).mockImplementation((url) => {
        if (url === "/suscripciones") return Promise.resolve(pageResponse(SUSCRIPCIONES_MOCK));
        if (url === "/usuarios") return Promise.resolve(pageResponse(USUARIOS_MOCK));
        return Promise.resolve(pageResponse([]));
      });

      renderSuscripciones();
      fireEvent.click(await screen.findByRole("button", { name: "+ Nueva suscripción" }));
      fireEvent.click(await screen.findByRole("button", { name: "Crear" }));

      expect(await screen.findByText("Selecciona un usuario y un plan activo.")).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it("carga los usuarios y solo planes activos usando los Select del modal", async () => {
      vi.mocked(api.get).mockImplementation((url) => {
        if (url === "/suscripciones") return Promise.resolve(pageResponse(SUSCRIPCIONES_MOCK));
        if (url === "/usuarios") return Promise.resolve(pageResponse(USUARIOS_MOCK));
        return Promise.resolve(pageResponse(PLANES_MOCK));
      });

      renderSuscripciones();
      fireEvent.click(await screen.findByRole("button", { name: "+ Nueva suscripción" }));

      expect(await screen.findByRole("button", { name: "Usuario" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Plan" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Plan" }));
      expect(screen.getAllByRole("option", { name: /Plan Mensual Básico/ })).toHaveLength(2);
      expect(screen.queryByRole("option", { name: /Plan Inactivo/ })).not.toBeInTheDocument();
    });

    it("rechaza una fecha de fin anterior a la fecha de inicio", async () => {
      const planConDuracionInvalida = { ...PLANES_MOCK[0], duracionDias: 0 };
      vi.mocked(api.get).mockImplementation((url) => {
        if (url === "/suscripciones") return Promise.resolve(pageResponse(SUSCRIPCIONES_MOCK));
        if (url === "/usuarios") return Promise.resolve(pageResponse(USUARIOS_MOCK));
        return Promise.resolve(pageResponse([planConDuracionInvalida]));
      });

      renderSuscripciones();
      fireEvent.click(await screen.findByRole("button", { name: "+ Nueva suscripción" }));

      fireEvent.click(await screen.findByRole("button", { name: "Usuario" }));
      const usuarioOptions = screen.getAllByRole("option", { name: /Ana García/ });
      fireEvent.click(usuarioOptions[usuarioOptions.length - 1]);

      fireEvent.click(screen.getByRole("button", { name: "Plan" }));
      const planOptions = screen.getAllByRole("option", { name: /Plan Mensual Básico/ });
      fireEvent.click(planOptions[planOptions.length - 1]);
      fireEvent.click(screen.getByRole("button", { name: "Crear" }));

      expect(
        await screen.findByText("La fecha de fin debe ser igual o posterior a la fecha de inicio.")
      ).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it("filtra usuarios a solo CLIENTE al abrir modal de nueva suscripción", async () => {
      const USUARIOS_MIX = [
        {
          id: 1,
          nombre: "Admin",
          email: "admin@test.com",
          rol: "ADMIN" as const,
          activo: true,
          creadoEn: "2026-01-01",
        },
        {
          id: 2,
          nombre: "Entrenador",
          email: "coach@test.com",
          rol: "ENTRENADOR" as const,
          activo: true,
          creadoEn: "2026-01-01",
        },
        {
          id: 3,
          nombre: "Cliente",
          email: "cliente@test.com",
          rol: "CLIENTE" as const,
          activo: true,
          creadoEn: "2026-01-01",
        },
      ];

      vi.mocked(api.get).mockImplementation((url, config) => {
        if (url === "/suscripciones") return Promise.resolve(pageResponse(SUSCRIPCIONES_MOCK));
        if (url === "/usuarios") {
          const rolFiltro = (config as { params?: { rol?: string } } | undefined)?.params?.rol;
          const usuarios =
            rolFiltro === "CLIENTE"
              ? USUARIOS_MIX.filter((usuario) => usuario.rol === "CLIENTE")
              : USUARIOS_MIX;
          return Promise.resolve(pageResponse(usuarios));
        }
        return Promise.resolve(pageResponse(PLANES_MOCK));
      });

      renderSuscripciones();
      fireEvent.click(await screen.findByRole("button", { name: "+ Nueva suscripción" }));
      fireEvent.click(await screen.findByRole("button", { name: "Usuario" }));

      expect(screen.getAllByRole("option", { name: /Cliente/ })).toHaveLength(2);
      expect(screen.queryByRole("option", { name: /Admin/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("option", { name: /Entrenador/ })).not.toBeInTheDocument();

      expect(api.get).toHaveBeenCalledWith("/usuarios", { params: { rol: "CLIENTE" } });
    });
  });

});
