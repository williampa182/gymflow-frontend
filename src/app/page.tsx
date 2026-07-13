import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Ruta raíz "/" — nunca se personalizó (seguía siendo el boilerplate de
// create-next-app). Server Component: lee la cookie "session" (no httpOnly,
// solo datos no sensibles — ver src/lib/auth.ts) y redirige sin parpadeo
// ni depender de JS del cliente.
export default async function Home() {
  const cookieStore = await cookies();
  const tieneSession = cookieStore.has("session");

  redirect(tieneSession ? "/dashboard" : "/login");
}
