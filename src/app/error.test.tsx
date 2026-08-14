import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorPage from "./error";

describe("ErrorPage", () => {
  const resetMock = vi.fn();

  beforeEach(() => {
    resetMock.mockClear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.stubGlobal("location", {
      href: "http://localhost:3000/login",
      reload: vi.fn(),
    });
  });

  it("con error de chunk muestra 'Recargar' y al hacer click recarga y limpia el flag", () => {
    render(<ErrorPage error={new Error("Loading chunk 12 failed.")} reset={resetMock} />);
    const boton = screen.getByRole("button", { name: "Recargar" });
    sessionStorage.setItem("gymflow:chunk-retry", String(Date.now()));
    fireEvent.click(boton);
    expect(window.location.reload).toHaveBeenCalled();
    expect(sessionStorage.getItem("gymflow:chunk-retry")).toBeNull();
  });

  it("con error de chunk y flag reciente NO auto-recarga", () => {
    sessionStorage.setItem("gymflow:chunk-retry", String(Date.now()));
    render(<ErrorPage error={new Error("Loading chunk 12 failed.")} reset={resetMock} />);
    expect(window.location.reload).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument();
  });

  it("con error genérico muestra 'Reintentar' y al hacer click llama a reset", () => {
    render(<ErrorPage error={new Error("boom")} reset={resetMock} />);
    const boton = screen.getByRole("button", { name: "Reintentar" });
    fireEvent.click(boton);
    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});