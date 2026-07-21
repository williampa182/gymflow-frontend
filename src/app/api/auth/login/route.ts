import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Duración de la cookie del token. Debe ser <= app.jwt.expiration del backend
// (si el backend cambia su duración, ajusta este valor también).
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

/**
 * Este Route Handler hace de intermediario entre el navegador y el backend de Spring.
 * El navegador nunca ve el JWT: lo recibimos aquí, lo guardamos en una cookie httpOnly,
 * y devolvemos al cliente solo los datos no sensibles (id, nombre, email, rol) para la UI.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => ({ message: "Credenciales inválidas." }));
    return NextResponse.json(errorBody, { status: backendRes.status });
  }

  const data = await backendRes.json();
  const { token, id, nombre, email, rol } = data;

  const response = NextResponse.json({ id, nombre, email, rol });

  // Cookie con el JWT real: httpOnly, invisible para JS del navegador.
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });

  // Cookie con datos de sesión. §1: httpOnly=true — antes era false y se
  // leía via document.cookie (manipulable por XSS). Ahora el client-side
  // la lee vía GET /api/auth/session (server-side), no directamente.
  response.cookies.set(
    "session",
    JSON.stringify({ id, nombre, email, rol }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE_SECONDS,
    }
  );

  return response;
}
