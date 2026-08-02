import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ has: () => false })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("landing pública", () => {
  it("muestra el hero, CTAs, funcionalidades y los 12 chips del stack", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", { name: /control total de tu gimnasio/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /iniciar sesi[oó]n/i })[0],
    ).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: /crear cuenta/i })[0]).toHaveAttribute(
      "href",
      "/register",
    );

    for (const feature of [
      "Gestión de planes",
      "Suscripciones",
      "Dashboard ADMIN",
      "Chat soporte",
    ]) {
      expect(screen.getByRole("heading", { name: feature })).toBeInTheDocument();
    }

    expect(
      screen.getByRole("heading", { name: /stack tecnológico/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("stack-chips").children).toHaveLength(12);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Playwright")).toBeInTheDocument();
  });
});
