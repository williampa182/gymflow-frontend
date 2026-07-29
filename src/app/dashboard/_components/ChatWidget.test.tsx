import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "@/lib/api";
import ChatWidget from "./ChatWidget";

beforeEach(() => {
  vi.clearAllMocks();
});

async function abrirYEscribir(texto: string) {
  const user = userEvent.setup();
  render(<ChatWidget />);
  await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));
  await user.type(screen.getByRole("textbox", { name: /mensaje para soporte/i }), texto);
  await user.click(screen.getByRole("button", { name: /^enviar$/i }));
  return user;
}

describe("ChatWidget", () => {
  it("está cerrado por defecto y no muestra el panel", () => {
    render(<ChatWidget />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre el panel al hacer click en el botón flotante", async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));
    expect(screen.getByRole("dialog", { name: /chat de soporte gymflow/i })).toBeInTheDocument();
  });

  it("envía el mensaje a /chat y muestra la respuesta del backend", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { respuesta: "El plan mensual cuesta $50.000" } });

    await abrirYEscribir("¿Cuánto cuesta el plan mensual?");

    expect(api.post).toHaveBeenCalledWith("/chat", { mensaje: "¿Cuánto cuesta el plan mensual?" });
    await waitFor(() => {
      expect(screen.getByText("El plan mensual cuesta $50.000")).toBeInTheDocument();
    });
  });

  it("muestra el mensaje del backend cuando el rate limit responde 429", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { status: 429, data: { message: "Demasiadas consultas. Espera un minuto." } },
    });

    await abrirYEscribir("hola");

    await waitFor(() => {
      expect(screen.getByText("Demasiadas consultas. Espera un minuto.")).toBeInTheDocument();
    });
  });

  it("muestra un mensaje genérico ante un error inesperado", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("network fail"));

    await abrirYEscribir("hola");

    await waitFor(() => {
      expect(screen.getByText(/no se pudo enviar tu mensaje/i)).toBeInTheDocument();
    });
  });

  it("renderiza negrita y viñetas de Markdown en vez de asteriscos literales", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        respuesta: "Planes disponibles:\n* **Plan Mensual:** acceso básico\n* **Plan Anual:** acceso completo",
      },
    });

    await abrirYEscribir("qué planes hay");

    await waitFor(() => {
      // El texto de negrita se separa en su propio nodo <strong>, así que se
      // busca por función en vez de un match exacto de string completo.
      expect(
        screen.getByText((_, el) => el?.tagName.toLowerCase() === "strong" && el.textContent === "Plan Mensual:")
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
    expect(screen.getByText(/acceso básico/)).toBeInTheDocument();
  });

  it("no permite enviar un mensaje vacío", async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));

    expect(screen.getByRole("button", { name: /^enviar$/i })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });
});
