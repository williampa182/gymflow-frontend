import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h, igual que login

/**
 * Registro público. El backend SIEMPRE crea el usuario con rol CLIENTE
 * (ver RegisterRequest.java) — este endpoint nunca puede usarse para
 * crear un ADMIN o ENTRENADOR, por diseño de seguridad.
 *
 * Igual que login: el JWT nunca toca el JS del navegador, viaja como
 * cookie httpOnly. Registrarse deja al usuario logueado de una vez
 * (AuthResponse incluye token), para no obligarlo a loguearse dos veces.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    const errorBody = await backendRes
      .json()
      .catch(() => ({ message: "No se pudo completar el registro." }));
    return NextResponse.json(errorBody, { status: backendRes.status });
  }

  const data = await backendRes.json();
  const { token, id, nombre, email, rol } = data;

  const response = NextResponse.json({ id, nombre, email, rol });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });

  response.cookies.set("session", JSON.stringify({ id, nombre, email, rol }), {
    // §1: httpOnly=true — antes era false y se leía via document.cookie.
    // Ahora el client-side lee vía GET /api/auth/session.
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });

  return response;
}
