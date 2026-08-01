import { describe, it, expect, vi } from "vitest";
import { logout } from "./auth";
import { CLAVE_CHAT_MENSAJES } from "./chatStorage";

describe("logout", () => {
  it("limpia la conversación del chat y redirige a la raíz", async () => {
    window.sessionStorage.setItem(
      CLAVE_CHAT_MENSAJES,
      JSON.stringify([{ id: "1", rol: "usuario", texto: "hola" }])
    );
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const location = { href: "" };
    Object.defineProperty(window, "location", { value: location, writable: true });

    await logout();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(window.sessionStorage.getItem(CLAVE_CHAT_MENSAJES)).toBeNull();
    expect(location.href).toBe("/");
  });
});
