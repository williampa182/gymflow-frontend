import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, POST } from "./route";

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

  it("reenvía multipart con su Content-Type y bytes intactos (import CSV)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ totalFilas: 1, creados: 1, omitidos: [], errores: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const formulario = new FormData();
    formulario.append(
      "archivo",
      new File(["nombre,tipoDocumento\nAna,CC"], "socios.csv", { type: "text/csv" })
    );
    const req = new NextRequest("http://localhost:3000/api/backend/usuarios/importar", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
      body: formulario,
    });
    req.cookies.set("token", "runtime-test-token");

    const response = await POST(req, {
      params: Promise.resolve({ path: ["usuarios", "importar"] }),
    });

    expect(response.status).toBe(200);
    const llamada = fetchMock.mock.calls[0];
    expect(String(llamada[1].headers["Content-Type"])).toMatch(/^multipart\/form-data/);
    expect(await response.json()).toEqual({ totalFilas: 1, creados: 1, omitidos: [], errores: [] });
  });
});
