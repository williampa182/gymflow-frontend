import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";

export default async function Home() {
  const cookieStore = await cookies();
  const tieneSession = cookieStore.has("session");

  if (tieneSession) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col">
      {/* ─── NAV FLOTANTE ────────────────────────────────────── */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4 sm:px-8">
        <span className="brand-glitch font-display text-xl font-bold tracking-tight text-concrete-50 sm:text-2xl">
          GYMFLOW
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-concrete-300 transition hover:text-hazard-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className={`${buttonSecondary} font-semibold bg-ink-700 border-hazard-400/30 text-concrete-50 hover:border-hazard-400 hover:text-hazard-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400`}
          >
            Crear cuenta
          </Link>
          <Link
            href="https://github.com/williampa182"
            className="text-sm font-semibold text-concrete-300 transition hover:text-hazard-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver código en GitHub"
          >
            GitHub
          </Link>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-rubber-floor px-4 pt-16 pb-12 sm:px-6">
        {/* Remaches esquinas */}
        <span className="rivet absolute left-3 top-3" />
        <span className="rivet absolute right-3 top-3" />
        <span className="rivet absolute bottom-3 left-3" />
        <span className="rivet absolute bottom-3 right-3" />

        {/* Subtítulo superior */}
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.25em] text-hazard-400 sm:text-sm">
          Sistema de gestión para gimnasios
        </p>

        {/* ── BARRA DE PESO MARQUEE ─────────────────────────── */}
        {/* El contenido se repite 2× para que el translateX(-50%)
            cree un loop infinito sin saltos. overflow-hidden recorta. */}
        <div className="w-full overflow-hidden" aria-hidden="true">
          <div className="barbell-marquee">
            {/* Bloque A (original) */}
            <MarqueeBlock />
            {/* Bloque B (copia exacta para el loop) */}
            <MarqueeBlock />
          </div>
        </div>

        {/* Versión accesible para lectores de pantalla */}
        <h1 className="sr-only">GYMFLOW — Control total de tu gimnasio</h1>

        {/* Tagline + CTAs */}
        <div className="mt-8 text-center">
          <p className="mx-auto max-w-xl text-base leading-relaxed text-concrete-300 sm:text-lg">
            Control total de tu gimnasio.
            <br />
            Planes, suscripciones y usuarios en un solo sistema.
          </p>
          <p className="mt-2 font-mono text-sm text-ink-500">
            Built like gym equipment — solid, simple, no fluff.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className={`${buttonPrimary} shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400`}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className={`${buttonSecondary} font-semibold bg-ink-700 border-hazard-400/30 text-concrete-50 hover:border-hazard-400 hover:text-hazard-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400`}
            >
              Crear cuenta
            </Link>
          </div>
        </div>

        {/* Hazard stripe inferior del hero */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 hazard-stripe" />
      </section>

      {/* ─── FEATURES ────────────────────────────────────────── */}
      <section className="bg-ink-900 px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-concrete-50 sm:text-4xl">
              ¿Qué incluye?
            </h2>
            <p className="mt-2 font-mono text-sm text-ink-500">
              Herramientas pensadas para operar, no para decorar.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FeaturePanel
              icon={<IconPlans />}
              title="CRUD de planes"
              description="Crea y edita planes de membresía con precios, duración y descripción. Control total sobre tu oferta comercial."
              accent="hazard"
            />
            <FeaturePanel
              icon={<IconSubs />}
              title="Suscripciones"
              description="Asocia clientes a planes, monitorea vencimientos y estados. Automatiza el seguimiento de pagos."
              accent="moss"
            />
            <FeaturePanel
              icon={<IconAnalytics />}
              title="Dashboard + analíticas"
              description="Visualiza usuarios por rol, suscripciones por estado e ingresos estimados por tipo de plan."
              accent="rust"
            />
            <FeaturePanel
              icon={<IconShield />}
              title="Autenticación segura"
              description="Login con roles (ADMIN, ENTRENADOR, CLIENTE). Sesiones con HTTP-only cookies y control de acceso."
              accent="neutral"
            />
          </div>
        </div>
      </section>

      {/* ─── TECH SPECS — "Placa de especificaciones" ────────── */}
      <section className="border-t border-ink-700 bg-ink-800 px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-concrete-50 sm:text-3xl">
              Especificaciones técnicas
            </h2>
            <p className="mt-2 font-mono text-sm text-ink-500">
              Lo que hay debajo del capó.
            </p>
          </header>

          <div className="relative rounded-none border-2 border-ink-700 bg-ink-900 p-6 shadow-[6px_6px_0_0_rgba(0,0,0,0.4)] sm:p-8">
            {/* Remaches */}
            <span className="rivet absolute left-3 top-3" />
            <span className="rivet absolute right-3 top-3" />
            <span className="rivet absolute bottom-3 left-3" />
            <span className="rivet absolute bottom-3 right-3" />

            {/* Hazard stripe top */}
            <div className="absolute top-0 left-0 right-0 h-1 hazard-stripe" />

            <ul className="space-y-4 pt-2">
              <SpecRow label="STACK" value="Next.js · Spring Boot · PostgreSQL" />
              <SpecRow label="AUTH" value="JWT · HTTP-only cookies · RBAC" />
              <SpecRow label="ROLES" value="Admin · Entrenador · Cliente" />
              <SpecRow label="API" value="REST proxy con rate limiting" />
              <SpecRow label="TESTS" value="18 passing" />
            </ul>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ───────────────────────────────────────── */}
      <section className="relative bg-rubber-floor px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-concrete-50 sm:text-4xl">
            ¿Listo para poner orden en tu gimnasio?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-concrete-300">
            Accedé al sistema y empezá a gestionar planes, usuarios y
            suscripciones desde un solo lugar.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className={`${buttonPrimary} shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400`}
            >
              Entrar al sistema
            </Link>
            <Link
              href="/register"
              className={`${buttonSecondary} font-semibold bg-ink-700 border-hazard-400/30 text-concrete-50 hover:border-hazard-400 hover:text-hazard-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400`}
            >
              Registrarse
            </Link>
          </div>
        </div>

        {/* Hazard stripe inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 hazard-stripe" />
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-ink-900 px-4 py-6 text-center sm:px-6">
        <p className="font-mono text-xs text-ink-500">
          GymFlow — portfolio project
        </p>
      </footer>
    </div>
  );
}

/* ─── Marquee Block ──────────────────────────────────────────── */
/* Un bloque del contenido del marquee. Se renderiza 2× en el DOM;
   el CSS (.barbell-marquee) traslada −50% para crear el loop.    */

function MarqueeBlock() {
  return (
    <div className="flex shrink-0 items-center">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center">
          {/* Texto GYMFLOW */}
          <span className="brand-glitch px-4 font-display text-5xl font-bold tracking-tight text-concrete-50 sm:px-6 md:text-7xl lg:text-8xl">
            GYMFLOW
          </span>
          {/* Disco de peso SVG separador */}
          <WeightPlate />
        </div>
      ))}
    </div>
  );
}

/* ─── Disco de peso SVG ──────────────────────────────────────── */

function WeightPlate() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0 text-hazard-400 sm:h-12 sm:w-12"
      aria-hidden="true"
    >
      {/* Anillo exterior */}
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" opacity="0.7" />
      {/* Anillo interior */}
      <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      {/* Agujero central (barra) */}
      <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/* ─── Feature Panel ──────────────────────────────────────────── */

const borderAccent = {
  hazard: "border-l-hazard-400",
  moss: "border-l-moss-600",
  rust: "border-l-rust-600",
  neutral: "border-l-concrete-300",
} as const;

function FeaturePanel({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "hazard" | "moss" | "rust" | "neutral";
}) {
  return (
    <div
      className={`relative rounded-none border-2 border-ink-700 border-l-4 ${borderAccent[accent]} bg-ink-800 p-5 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.4)]`}
    >
      {/* Remaches */}
      <span className="rivet absolute right-2.5 top-2.5" />
      <span className="rivet absolute bottom-2.5 right-2.5" />

      <div className="mb-3 text-hazard-400">{icon}</div>
      <h3 className="font-display text-lg font-bold text-concrete-50">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-concrete-300">
        {description}
      </p>
    </div>
  );
}

/* ─── Spec Row ───────────────────────────────────────────────── */

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-col gap-1 border-b border-ink-700/50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-20 shrink-0 font-mono text-xs font-medium uppercase tracking-wider text-hazard-400">
        {label}
      </span>
      <span className="font-mono text-sm text-concrete-300">{value}</span>
    </li>
  );
}

/* ─── Iconos SVG propios (sin dependencias externas) ─────────── */

function IconPlans() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-current">
      <rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10h8M8 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 12l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSubs() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-current">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-current">
      <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 7l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-current">
      <path d="M12 3l8 4v5c0 5.5-3.4 8.6-8 10-4.6-1.4-8-4.5-8-10V7l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
