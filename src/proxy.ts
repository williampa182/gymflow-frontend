/**
 * proxy.ts — Defensa en profundidad de UX (NO es la barrera de autorización real)
 *
 * PROPÓSITO DE ESTE ARCHIVO:
 *   - Evitar que el servidor de Next.js sirva HTML/JS de rutas /dashboard/* a
 *     usuarios que no tienen la cookie `token` (JWT, httpOnly). Esto corta el
 *     FOUC (flash of unauthorized content) y reduce la superficie de rutas
 *     expuestas a usuarios no autenticados.
 *   - Para rutas admin (/dashboard/usuarios, /dashboard/suscripciones), leer
 *     la cookie `session` (httpOnly, JSON) y redirigir a /dashboard si el rol
 *     no es "ADMIN". Esto corta el FOUC de rutas admin antes del primer render.
 *
 * QUÉ NO HACE ESTE ARCHIVO (la barrera de seguridad REAL):
 *   - Este proxy NO valida la firma del JWT. Un token con firma inválida
 *     pasaría el gate de autenticación aquí, pero el backend lo rechazaría con
 *     403 en cada llamada a la API.
 *   - La autorización real está en el backend Spring Boot: cada endpoint usa
 *     @PreAuthorize("hasRole('ADMIN')") o equivalente, validando el JWT de la
 *     cookie `token` (httpOnly, inalcanzable por JS del browser). ESA es la
 *     fuente de verdad de seguridad — este proxy es solo una mejora de UX.
 *   - La cookie `session` (httpOnly desde §1) contiene { id, nombre, email, rol }
 *     y se usa SOLO para decidir si mostrar o no el contenido de una ruta en el
 *     edge. No es autoritativa: si alguien manipulara el backend para poner un
 *     rol falso en esa cookie, aún así fallaría contra @PreAuthorize.
 *
 * Refs: security-deep-dive-additional-findings.md §1 y §6 · OWASP A01:2021
 */

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
