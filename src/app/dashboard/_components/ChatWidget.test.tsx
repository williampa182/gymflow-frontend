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
import { CLAVE_CHAT_MENSAJES } from "@/lib/chatStorage";

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
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

  it("muestra el aviso de proveedor externo al abrir el chat", async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));
    expect(screen.getByText(/la conversación la procesa un proveedor externo/i)).toBeInTheDocument();
  });

  it("envía el mensaje a /chat y muestra la respuesta del backend", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { respuesta: "El plan mensual cuesta $50.000" } });

    await abrirYEscribir("¿Cuánto cuesta el plan mensual?");

    expect(api.post).toHaveBeenCalledWith("/chat", { mensaje: "¿Cuánto cuesta el plan mensual?" }, { timeout: 30000 });
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

  it("renderiza una tabla Markdown como <table> en vez de líneas con pipes", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        respuesta:
          "Estos son los planes:\n| Plan | Precio |\n|---|---|\n| Mensual | $50.000 |\n| Anual | $500.000 |",
      },
    });

    await abrirYEscribir("qué planes hay");

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.getByRole("columnheader", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Precio" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Mensual" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "$500.000" })).toBeInTheDocument();
    expect(screen.queryByText(/---/)).not.toBeInTheDocument();
  });

  it("no permite enviar un mensaje vacío", async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));

    expect(screen.getByRole("button", { name: /^enviar$/i })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("persiste la conversación en sessionStorage y la restaura al volver a montar", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { respuesta: "Respuesta guardada" } });

    const user = userEvent.setup();
    const primera = render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));
    await user.type(screen.getByRole("textbox", { name: /mensaje para soporte/i }), "¿cuánto cuesta?");
    await user.click(screen.getByRole("button", { name: /^enviar$/i }));
    await waitFor(() => {
      expect(screen.getByText("Respuesta guardada")).toBeInTheDocument();
    });
    primera.unmount();

    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));

    expect(screen.getByText("¿cuánto cuesta?")).toBeInTheDocument();
    expect(screen.getByText("Respuesta guardada")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("ignora datos corruptos en sessionStorage y arranca limpio", async () => {
    window.sessionStorage.setItem(CLAVE_CHAT_MENSAJES, "{esto no es json");

    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));

    expect(screen.getByText(/hola. preguntame algo/i)).toBeInTheDocument();
  });

  it("filtra mensajes con forma inválida al hidratar desde sessionStorage", async () => {
    window.sessionStorage.setItem(
      CLAVE_CHAT_MENSAJES,
      JSON.stringify([
        { id: "1", rol: "usuario", texto: "mensaje válido" },
        { id: "2", rol: "bot", texto: "rol inválido" },
        { rol: "asistente" },
      ])
    );

    const user = userEvent.setup();
    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /abrir chat de soporte/i }));

    expect(screen.getByText("mensaje válido")).toBeInTheDocument();
    expect(screen.queryByText(/rol inválido/)).not.toBeInTheDocument();
  });
});
