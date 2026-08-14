import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LoginPage", () => {
  it("muestra el formulario con campos, botón y link a registro", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /regístrate/i })).toHaveAttribute("href", "/register");
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
  });

  it("explica el motivo cuando llega con sesion=expirada (B-06)", () => {
    vi.stubGlobal("location", {
      search: "?sesion=expirada",
    });
    render(<LoginPage />);
    expect(screen.getByText("Tu sesión expiró. Ingresá de nuevo para continuar.")).toBeInTheDocument();
  });

  it("no muestra el aviso de sesión expirada sin el query param", () => {
    vi.stubGlobal("location", { search: "" });
    render(<LoginPage />);
    expect(screen.queryByText("Tu sesión expiró. Ingresá de nuevo para continuar.")).not.toBeInTheDocument();
  });
});
