import { NextRequest, NextResponse } from "next/server";

/**
 * §1 (security-deep-dive): endpoint que expone la cookie "session" al
 * client-side JS de forma segura. Antes, la cookie session era httpOnly:false
 * y se leía via document.cookie — cualquier JS en el browser (XSS, extensión)
 * podía leer y ESPECIALMENTE MODIFICAR el rol a "ADMIN".
 *
 * Ahora la cookie session es httpOnly:true. El client-side llama a este
 * endpoint (server-side) que la lee directamente y devuelve los datos.
 */
export async function GET(request: NextRequest) {
  const sessionRaw = request.cookies.get("session")?.value;
  if (!sessionRaw) {
    return NextResponse.json(
      { message: "No autenticado" },
      { status: 401 }
    );
  }

  try {
    const session = JSON.parse(sessionRaw);
    return NextResponse.json({
      id: session.id,
      nombre: session.nombre,
      email: session.email,
      rol: session.rol,
    });
  } catch {
    return NextResponse.json(
      { message: "Sesión inválida" },
      { status: 401 }
    );
  }
}
