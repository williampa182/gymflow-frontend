import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ToastHost } from "@/components/ToastHost";
import { ToastProvider } from "@/lib/toast";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@/components/CarnetQR", () => ({
  CarnetQR: ({ valor }: { valor: string }) => (
    <div data-testid="carnet-qr-stub">{valor}</div>
  ),
}));

import api from "@/lib/api";
import { MiCarnet } from "./MiCarnet";

function renderMiCarnet() {
  return render(
    <ToastProvider>
      <MiCarnet />
      <ToastHost />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MiCarnet", () => {
  it("carga el carnet del cliente y muestra el código junto al QR", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { codigoCarnet: "ABCDEF1" } });

    renderMiCarnet();

    await waitFor(() =>
      expect(screen.getAllByText("ABCDEF1").length).toBeGreaterThan(0)
    );
    expect(api.get).toHaveBeenCalledWith("/asistencias/mi/carnet");
    expect(screen.getByTestId("carnet-qr-stub")).toHaveTextContent("ABCDEF1");
  });

  it("muestra mensaje de error si falla la carga", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Network error"));

    renderMiCarnet();

    await waitFor(() =>
      expect(screen.getAllByText("No se pudo cargar tu carnet.").length).toBeGreaterThan(0)
    );
  });
});