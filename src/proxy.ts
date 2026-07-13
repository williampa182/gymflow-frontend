import { NextRequest, NextResponse } from "next/server";

// Rutas del dashboard que solo puede ver ADMIN (coincide con @PreAuthorize del backend)
const RUTAS_SOLO_ADMIN = ["/dashboard/usuarios", "/dashboard/suscripciones"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  // Sin token → no autenticado, fuera a login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Con token pero ruta solo-ADMIN → verificar rol desde la cookie "session"
  const esRutaAdmin = RUTAS_SOLO_ADMIN.some((ruta) => pathname.startsWith(ruta));
  if (esRutaAdmin) {
    const sessionRaw = request.cookies.get("session")?.value;
    let rol: string | null = null;

    try {
      rol = sessionRaw ? JSON.parse(sessionRaw).rol : null;
    } catch {
      rol = null;
    }

    if (rol !== "ADMIN") {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
