import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/**
 * Proxy genérico hacia el backend de Spring Boot.
 *
 * Por qué existe: el JWT vive en una cookie httpOnly, así que el JS del navegador
 * (axios en el cliente) NO puede leerlo para mandarlo como header Authorization.
 * En cambio, el cliente llama a rutas relativas tipo /api/backend/planes, que
 * corren en el servidor de Next.js, donde SÍ podemos leer la cookie httpOnly
 * y adjuntarla como Bearer token al reenviar la petición real al backend.
 */
/**
 * Valida cada segmento del path ANTES de construir la URL destino.
 *
 * Por qué: `new URL()` normaliza ".." en el pathname. Sin este chequeo,
 * un request a /api/backend/../actuator/prometheus terminaba armando
 * `${BACKEND_URL}/actuator/prometheus` — fuera del prefijo /api/ que este
 * proxy pretende respetar, saltando el scoping esperado (hallazgo
 * confirmado en la auditoría de seguridad, THREAT_MODEL.md 2.6).
 * Rechazamos cualquier segmento vacío, ".", "..", o que contenga "/" ya
 * decodificado — solo se permiten nombres de recurso normales.
 */
function esPathSeguro(path: string[]): boolean {
  if (path.length === 0) return false;
  return path.every((seg) => {
    if (seg.length === 0 || seg === "." || seg === "..") return false;
    if (seg.includes("/") || seg.includes("\\")) return false;
    return true;
  });
}

/**
 * Chequeo básico de origen como defensa en profundidad contra CSRF.
 *
 * Por qué: el backend tiene CSRF explícitamente deshabilitado (es una API
 * stateless con JWT, lo cual es correcto en general), y este proxy es el
 * único punto donde la cookie httpOnly se convierte automáticamente en un
 * Authorization header válido. SameSite=Lax en la cookie ya bloquea la
 * mayoría de los casos, pero no todos (navegaciones top-level cross-site
 * vía formularios, por ejemplo). Validar Origin/Referer acá es una capa
 * barata adicional que no depende de los matices de SameSite.
 */
function origenValido(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  // Requests same-origin de navegación normal a veces no mandan Origin en
  // GET; en esos casos confiamos en SameSite. Para métodos que mutan
  // estado, exigimos que el header exista y coincida.
  const isMutating = !["GET", "HEAD"].includes(request.method);
  if (!isMutating) return true;

  if (!origin) return false;
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? request.nextUrl.origin;
  return origin === allowedOrigin;
}

async function proxy(request: NextRequest, path: string[]) {
  if (!esPathSeguro(path)) {
    return NextResponse.json({ message: "Ruta inválida" }, { status: 400 });
  }
  if (!origenValido(request)) {
    return NextResponse.json({ message: "Origen no permitido" }, { status: 403 });
  }

  const token = request.cookies.get("token")?.value;
  // Fase 5: el kiosco autentica con X-Kiosk-Key (credencial de dispositivo,
  // permitAll en el backend). La whitelist es EXACTA: el header solo se
  // reenvía hacia /api/asistencias/kiosk, nunca a otras rutas.
  const esCheckInKiosk = path.join("/") === "asistencias/kiosk";
  const kioskKey = esCheckInKiosk ? request.headers.get("x-kiosk-key") : null;

  const targetUrl = new URL(`${BACKEND_URL}/api/${path.join("/")}`);
  // Reenvía los query params tal cual (?rol=ADMIN, ?activo=true, etc.)
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  const backendRes = await fetch(targetUrl, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(kioskKey ? { "X-Kiosk-Key": kioskKey } : {}),
    },
    body: body && body.length > 0 ? body : undefined,
  });

  const responseText = await backendRes.text();
  const contentType = backendRes.headers.get("content-type") ?? "application/json";

  // Status sin body permitido (204 No Content, 304 Not Modified, 205 Reset
  // Content): el constructor de Response/NextResponse rechaza un string body
  // con estos códigos ("Invalid response status code 204") y el proxy
  // terminaría devolviendo 500 al navegador aunque el backend respondió
  // correctamente (bug detectado con DELETE /api/usuarios/{id} en prod).
  const sinBody = backendRes.status === 204 || backendRes.status === 205 || backendRes.status === 304;

  return new NextResponse(sinBody ? null : responseText, {
    status: backendRes.status,
    headers: { "content-type": contentType },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
