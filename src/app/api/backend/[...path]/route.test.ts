import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "./route";

// Regresión 2026-08-07: el proxy crasheaba al reenviar respuestas 204
// (No Content) — `new NextResponse("", { status: 204 })` lanza
// "Invalid response status code 204" porque 204 no admite body. El
// navegador veía un 500 y el frontend mostraba "No se pudo eliminar el
// usuario" aunque el backend YA lo había borrado (auditoría en prod).
function request(path: string[]) {
  const req = new NextRequest(`http://localhost:3000/api/backend/${path.join("/")}`, {
    method: "DELETE",
    headers: { origin: "http://localhost:3000" },
  });
  req.cookies.set("token", "runtime-test-token");
  return req;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("route /api/backend/[...path] (proxy)", () => {
  it("reenvía 204 No Content sin crashear (DELETE usuario)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const response = await DELETE(request(["usuarios", "7"]), {
      params: Promise.resolve({ path: ["usuarios", "7"] }),
    });

    expect(response.status).toBe(204);
  });

  it("reenvía 400 con su body tal cual", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "No puedes borrar tu propio usuario" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        })
      )
    );

    const response = await DELETE(request(["usuarios", "1"]), {
      params: Promise.resolve({ path: ["usuarios", "1"] }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "No puedes borrar tu propio usuario" });
  });

  it("reenvía errores 500 del backend con su body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "boom" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        })
      )
    );

    const response = await DELETE(request(["usuarios", "99"]), {
      params: Promise.resolve({ path: ["usuarios", "99"] }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: "boom" });
  });
});
