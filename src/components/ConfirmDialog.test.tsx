import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

function renderDialogo(overrides: {
  abierto?: boolean;
  confirmando?: boolean;
  onCancelar?: () => void;
  onConfirmar?: () => void;
} = {}) {
  return render(
    <ConfirmDialog
      abierto={overrides.abierto ?? true}
      titulo="¿Desactivar el plan?"
      mensaje="Esta acción no se puede deshacer."
      textoConfirmar="Desactivar"
      confirmando={overrides.confirmando ?? false}
      onCancelar={overrides.onCancelar ?? vi.fn()}
      onConfirmar={overrides.onConfirmar ?? vi.fn()}
    />
  );
}

describe("components/ConfirmDialog.tsx", () => {
  it("no renderiza nada cuando abierto es false", () => {
    renderDialogo({ abierto: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Esta acción no se puede deshacer.")).not.toBeInTheDocument();
  });

  it("muestra el título, el mensaje y los botones Cancelar/Confirmar", () => {
    renderDialogo();

    expect(
      screen.getByRole("heading", { name: "¿Desactivar el plan?" })
    ).toBeInTheDocument();
    expect(screen.getByText("Esta acción no se puede deshacer.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
  });

  it("Confirmar llama a onConfirmar", () => {
    const onConfirmar = vi.fn();
    renderDialogo({ onConfirmar });

    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("Cancelar llama a onCancelar", () => {
    const onCancelar = vi.fn();
    renderDialogo({ onCancelar });

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("Escape llama a onCancelar (focus trap)", () => {
    const onCancelar = vi.fn();
    renderDialogo({ onCancelar });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("deshabilita el botón de confirmar mientras confirmando", () => {
    renderDialogo({ confirmando: true });

    expect(screen.getByRole("button", { name: "…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).not.toBeDisabled();
  });
});
