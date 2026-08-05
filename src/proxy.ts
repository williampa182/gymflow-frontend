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
 *   - Desde M2 (2026-08-04): servir la Content-Security-Policy completa con
 *     nonce en TODAS las respuestas HTML (todas las ramas, incluido el early
 *     return de rutas no-dashboard). El matcher se amplió a toda la app
 *     (excepto API y assets estáticos) para que ninguna página quede sin la
 *     red de contención (ver consejo M2: condición 1).
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
 * CSP (M2): el nonce se aplica automáticamente a los scripts de Next durante
 * el SSR (extrae el nonce del header CSP de la request — guía oficial
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 * Por eso el layout raíz fuerza render dinámico (connection()).
 *
 * DESVIACIONES PROPIAS (documentadas en la propuesta M2, no son "lo que dice
 * la guía"):
 *   - style-src 'unsafe-inline': los nonces no cubren atributos style="";
 *     Recharts los usa (AdminDashboardCharts.tsx) — el anti-XSS vive en
 *     script-src, los estilos no ejecutan código.
 *   - upgrade-insecure-requests solo en prod: en dev rompe http://localhost.
 *   - connect-src con ws://localhost:3000 solo en dev (HMR de Next).
 *
 * Refs: security-deep-dive-additional-findings.md §1 y §6 · OWASP A01:2021 ·
 * propuesta 2026-08-04-m2-csp-nonce.md (veredicto consejo: ADOPTAR CON
 * CONDICIONES, condiciones 1-7).
 */

import { NextRequest, NextResponse } from "next/server";

const DEV = process.env.NODE_ENV === "development";

// Rutas del dashboard que solo puede ver ADMIN (coincide con @PreAuthorize del backend)
const RUTAS_SOLO_ADMIN = ["/dashboard/usuarios", "/dashboard/asistencias"];

function buildCsp(nonce: string): string {
  const header = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${DEV ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    font-src 'self';
    connect-src 'self'${DEV ? " ws://localhost:3000" : ""};
    media-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${DEV ? "" : "upgrade-insecure-requests;"}
  `;
  // Reemplaza saltos de línea y espacios dobles (patrón de la guía oficial)
  return header.replace(/\s{2,}/g, " ").trim();
}

export function proxy(request: NextRequest) {
  // Nonce único por request, en base64 (guía oficial content-security-policy.md:48)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { pathname } = request.nextUrl;

  // Sin token → no autenticado, fuera a login (con CSP en la respuesta)
  const responseConCsp = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  if (!pathname.startsWith("/dashboard")) {
    return responseConCsp(
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return responseConCsp(NextResponse.redirect(loginUrl));
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
      return responseConCsp(NextResponse.redirect(dashboardUrl));
    }
  }

  return responseConCsp(
    NextResponse.next({ request: { headers: requestHeaders } })
  );
}

export const config = {
  // Todas las rutas excepto API y assets estáticos (patrón de la guía oficial,
  // content-security-policy.md:137-156). El filtro `missing` de prefetch evita
  // que cada next/link dispare proxy + nonce + render dinámico en Railway.
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
