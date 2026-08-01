import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "./toast";
import { ToastHost } from "@/components/ToastHost";

function Probe() {
  const { notificar } = useToast();
  return (
    <>
      <button onClick={() => notificar("exito", "Plan guardado.")}>
        disparar
      </button>
      <ToastHost />
    </>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("sistema de toasts", () => {
  it("muestra el toast y lo auto-oculta después de la duración", () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("disparar"));
    expect(screen.getByText("Plan guardado.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText("Plan guardado.")).not.toBeInTheDocument();
  });

  it("permite cerrar el toast manualmente", () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("disparar"));
    expect(screen.getByText("Plan guardado.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Cerrar notificación"));

    expect(screen.queryByText("Plan guardado.")).not.toBeInTheDocument();
  });

  it("acumula varios toasts en cola", () => {
    function ProbeMulti() {
      const { notificar } = useToast();
      return (
        <>
          <button onClick={() => notificar("exito", "Uno.")}>uno</button>
          <button onClick={() => notificar("error", "Dos.")}>dos</button>
          <ToastHost />
        </>
      );
    }

    render(
      <ToastProvider>
        <ProbeMulti />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("uno"));
    fireEvent.click(screen.getByText("dos"));

    expect(screen.getByText("Uno.")).toBeInTheDocument();
    expect(screen.getByText("Dos.")).toBeInTheDocument();
  });
});
