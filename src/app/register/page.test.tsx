import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
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
});
