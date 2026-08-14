import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "./page";

const { mockPush, mockRefresh, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockReplace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh, replace: mockReplace }),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockPush.mockClear();
    mockRefresh.mockClear();
    mockReplace.mockClear();
  });

  it("muestra el formulario con campos, botón y link a login", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    render(<RegisterPage />);
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /inicia sesión/i })).toHaveAttribute("href", "/login");
  });

  it("ofrece elegir rol con cliente por defecto y nota de administrador", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    render(<RegisterPage />);
    expect(screen.getByRole("radio", { name: /soy cliente/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /soy entrenador/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /soy cliente/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /soy entrenador/i })).not.toBeChecked();
    await screen.findByText(/el rol de administrador lo asigna/i);
  });

  it("muestra el aviso de bootstrap cuando el backend no tiene admins", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ primerRegistroSeraAdmin: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<RegisterPage />);
    expect(await screen.findByText(/nacerás como administrador \(bootstrap\)/i)).toBeInTheDocument();
  });

  it("envía el rol elegido en el body de registro", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // GET estado
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, nombre: "Ana", email: "ana@mail.com", rol: "ENTRENADOR" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ana@mail.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "ContrasenaSegura12!" },
    });
    fireEvent.click(screen.getByRole("radio", { name: /soy entrenador/i }));
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url]) => url === "/api/auth/register"
      );
      expect(postCall).toBeDefined();
      const body = JSON.parse(postCall?.[1]?.body ?? "{}");
      expect(body.rol).toBe("ENTRENADOR");
    });
  });

  it("submit vacío muestra errores en nombre, email y password", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    render(<RegisterPage />);
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
    expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
    expect(screen.getByText("El email es obligatorio")).toBeInTheDocument();
    expect(
      screen.getByText("La contraseña debe tener al menos 12 caracteres")
    ).toBeInTheDocument();
  });

  it('"Password1" da medidor nivel 2 "Aceptable" y submit rechaza localmente', () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ana@mail.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "Password1" },
    });
    expect(screen.getByText("Aceptable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
    expect(
      screen.getByText("La contraseña debe tener al menos 12 caracteres")
    ).toBeInTheDocument();
  });

  it('"Password123!" da medidor nivel 4 "Muy fuerte" y submit redirige', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // GET estado
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, nombre: "Ana", email: "ana@mail.com", rol: "CLIENTE" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ana@mail.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "Password123!" },
    });
    expect(screen.getByText("Muy fuerte")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("email inválido muestra error de email", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "invalido" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
    expect(screen.getByText("Email inválido")).toBeInTheDocument();
  });
});
