import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";

const darkSecondaryButton =
  `${buttonSecondary} font-semibold !border-hazard-400/30 !bg-ink-700 !text-concrete-50 hover:!border-hazard-400 hover:!bg-ink-700 hover:!text-hazard-400`;

const features = [
  {
    title: "Gestión de planes",
    description:
      "Crea y edita planes de membresía con precio, duración y descripción. Tu oferta comercial, siempre bajo control.",
    icon: <IconPlans />,
  },
  {
    title: "Suscripciones",
    description:
      "Asocia clientes a planes y consulta estados y vencimientos sin perseguir datos en hojas de cálculo.",
    icon: <IconSubscriptions />,
  },
  {
    title: "Dashboard ADMIN",
    description:
      "Usuarios, roles, suscripciones e ingresos estimados en una vista operativa, clara y accionable.",
    icon: <IconDashboard />,
  },
  {
    title: "Chat soporte",
    description:
      "Una guía integrada para recorrer el panel y resolver dudas sobre planes, suscripciones y operaciones.",
    icon: <IconChat />,
  },
] satisfies Array<{ title: string; description: string; icon: ReactNode }>;

const stackItems = [
  { name: "Next.js", icon: "next" },
  { name: "React", icon: "react" },
  { name: "TS", icon: "ts" },
  { name: "Tailwind", icon: "tailwind" },
  { name: "Spring Boot", icon: "spring" },
  { name: "Postgres", icon: "postgres" },
  { name: "Redis", icon: "redis" },
  { name: "Vercel", icon: "vercel" },
  { name: "Render", icon: "render" },
  { name: "Resend", icon: "resend" },
  { name: "Gemini", icon: "gemini" },
  { name: "Vitest", icon: "vitest" },
  { name: "Playwright", icon: "playwright" },
] as const;

type StackIconName = (typeof stackItems)[number]["icon"];

const stackIconLabels: Record<StackIconName, string> = {
  next: "N",
  react: "R",
  ts: "TS",
  tailwind: "TW",
  spring: "SB",
  postgres: "PG",
  redis: "RD",
  vercel: "VC",
  render: "RE",
  resend: "RS",
  gemini: "GM",
  vitest: "VT",
  playwright: "PW",
};

export default async function Home() {
  const cookieStore = await cookies();

  if (cookieStore.has("session")) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <nav
        aria-label="Navegación principal"
        className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-8"
      >
        <Link
          href="/"
          className="brand-glitch font-display text-xl font-bold tracking-tight text-concrete-50 sm:text-2xl"
        >
          GYMFLOW
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-concrete-300 transition hover:text-hazard-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className={`${darkSecondaryButton} hidden sm:inline-flex`}
          >
            Crear cuenta
          </Link>
          <Link
            href="https://github.com/williampa182"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver código en GitHub"
            className="hidden text-sm font-semibold text-concrete-300 transition hover:text-hazard-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard-400 md:inline"
          >
            GitHub
          </Link>
        </div>
      </nav>

      <main>
        <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden bg-rubber-floor px-4 pb-14 pt-28 sm:px-6 sm:pt-32">
          <span className="rivet absolute left-3 top-3" aria-hidden="true" />
          <span className="rivet absolute right-3 top-3" aria-hidden="true" />
          <span className="rivet absolute bottom-3 left-3" aria-hidden="true" />
          <span className="rivet absolute bottom-3 right-3" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-hazard-400 sm:text-sm">
              Sistema de gestión para gimnasios
            </p>

            <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-concrete-50 sm:text-7xl lg:text-8xl">
              Control total de tu gimnasio
              <span className="text-hazard-400">.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-concrete-300 sm:text-lg">
              Planes, suscripciones y usuarios en un solo sistema. Una sala de
              máquinas digital para que tu operación avance sin fricción.
            </p>

            <p className="mt-3 font-mono text-xs text-ink-500 sm:text-sm">
              Construido como un equipo de gimnasio — sólido, simple, sin humo.
            </p>

            <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/login"
                className={`${buttonPrimary} w-full justify-center px-6 py-3 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] sm:w-auto`}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className={`${darkSecondaryButton} w-full justify-center px-6 py-3 text-center sm:w-auto`}
              >
                Crear cuenta
              </Link>
            </div>

            <div className="mt-12 w-full overflow-hidden" aria-hidden="true">
              <div className="barbell-marquee">
                <MarqueeBlock />
                <MarqueeBlock />
              </div>
            </div>
          </div>

          <div className="hazard-stripe absolute bottom-0 left-0 right-0 h-1.5" />
        </section>

        <section className="bg-ink-900 px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="mb-10 text-center sm:mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-hazard-400">
                Módulos de operación
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-concrete-50 sm:text-4xl">
                Herramientas pensadas para operar
              </h2>
              <p className="mt-2 font-mono text-sm text-ink-500">
                Menos ruido. Más control sobre la sala.
              </p>
            </header>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {features.map((feature, index) => (
                <FeaturePanel key={feature.title} {...feature} number={index + 1} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-ink-700 bg-ink-900 px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="mb-10 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-hazard-400">
                Vista de producto
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-concrete-50 sm:text-4xl">
                El tablero, en acción
              </h2>
              <p className="mx-auto mt-2 max-w-2xl font-mono text-sm leading-relaxed text-ink-500">
                Un recorrido real por el dashboard ADMIN con métricas pobladas y
                navegación a las secciones principales.
              </p>
            </header>

            <div className="relative overflow-hidden border-2 border-ink-700 bg-black shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]">
              <span className="rivet absolute left-3 top-3" aria-hidden="true" />
              <span className="rivet absolute right-3 top-3" aria-hidden="true" />
              <span className="rivet absolute bottom-3 left-3" aria-hidden="true" />
              <span className="rivet absolute bottom-3 right-3" aria-hidden="true" />
              <div className="hazard-stripe h-1.5" />
              <video
                className="block w-full"
                src="/videos/admin-dashboard.webm"
                autoPlay
                muted
                loop
                playsInline
                aria-label="Recorrido del dashboard ADMIN de GymFlow"
              />
            </div>
            <p className="mt-4 text-sm text-concrete-300">
              Métricas reales de usuarios, suscripciones y planes desde la sala
              de control.
            </p>
          </div>
        </section>

        <section className="border-t border-ink-700 bg-ink-800 px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <header className="mb-10 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-hazard-400">
                Herramientas de la máquina
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-concrete-50 sm:text-4xl">
                Stack tecnológico
              </h2>
              <p className="mt-2 font-mono text-sm text-ink-500">
                Frontend, backend, datos e integraciones en una sola placa.
              </p>
            </header>

            <div className="relative overflow-hidden border-2 border-ink-700 bg-ink-900 p-6 shadow-[6px_6px_0_0_rgba(0,0,0,0.4)] sm:p-8">
              <span className="rivet absolute left-3 top-3" aria-hidden="true" />
              <span className="rivet absolute right-3 top-3" aria-hidden="true" />
              <span className="rivet absolute bottom-3 left-3" aria-hidden="true" />
              <span className="rivet absolute bottom-3 right-3" aria-hidden="true" />
              <div className="hazard-stripe absolute left-0 right-0 top-0 h-1" />

              <div
                data-testid="stack-chips"
                className="flex flex-wrap gap-2.5 pt-2"
              >
                {stackItems.map((item) => (
                  <StackChip key={item.name} name={item.name} icon={item.icon} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-ink-700 bg-ink-800 px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-3xl">
            <header className="mb-10 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-hazard-400">
                Bajo el capó
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-concrete-50 sm:text-4xl">
                Decisiones técnicas
              </h2>
              <p className="mt-2 font-mono text-sm text-ink-500">
                La arquitectura también forma parte del producto.
              </p>
            </header>

            <div className="relative overflow-hidden border-2 border-ink-700 bg-ink-900 p-6 shadow-[6px_6px_0_0_rgba(0,0,0,0.4)] sm:p-8">
              <span className="rivet absolute left-3 top-3" aria-hidden="true" />
              <span className="rivet absolute right-3 top-3" aria-hidden="true" />
              <span className="rivet absolute bottom-3 left-3" aria-hidden="true" />
              <span className="rivet absolute bottom-3 right-3" aria-hidden="true" />
              <div className="hazard-stripe absolute left-0 right-0 top-0 h-1" />

              <ul className="space-y-4 pt-2">
                <SpecRow
                  label="AUTH"
                  value="JWT en cookie HTTP-only para reducir la exposición del token al JavaScript del navegador y mitigar el robo por XSS."
                />
                <SpecRow
                  label="RATE LIMIT"
                  value="Redis protege el login contra fuerza bruta y permite compartir el estado entre instancias si el backend escala."
                />
                <SpecRow
                  label="ROLES"
                  value="El acceso por rol (ADMIN, ENTRENADOR, CLIENTE) se valida de forma estricta en el backend, no solo en la interfaz."
                />
                <SpecRow
                  label="PROXY"
                  value="El frontend enruta las llamadas REST hacia el backend sin exponer su URL interna directamente al navegador."
                />
              </ul>
            </div>
          </div>
        </section>

        <section className="relative bg-rubber-floor px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-hazard-400">
              Siguiente movimiento
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-concrete-50 sm:text-5xl">
              ¿Listo para probarlo tú mismo?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-concrete-300">
              Entra al sistema y gestiona planes, suscripciones y usuarios desde
              un solo panel de control.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className={`${buttonPrimary} w-full justify-center px-6 py-3 text-center shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] sm:w-auto`}
              >
                Entrar al sistema
              </Link>
              <Link
                href="/register"
                className={`${darkSecondaryButton} w-full justify-center px-6 py-3 text-center sm:w-auto`}
              >
                Registrarse
              </Link>
            </div>
          </div>
          <div className="hazard-stripe absolute bottom-0 left-0 right-0 h-1.5" />
        </section>
      </main>

      <footer className="border-t border-ink-700 bg-ink-900 px-4 py-7 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 font-mono text-xs text-ink-500 sm:flex-row">
          <span>GymFlow — proyecto de portafolio</span>
          <span>Sala de máquinas digital</span>
        </div>
      </footer>
    </div>
  );
}

function FeaturePanel({
  title,
  description,
  icon,
  number,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  number: number;
}) {
  return (
    <article className="relative overflow-hidden border-2 border-ink-700 bg-ink-800 p-5 pt-7 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.45)]">
      <div className="hazard-stripe absolute left-0 right-0 top-0 h-1.5" />
      <span className="rivet absolute right-3 top-3" aria-hidden="true" />
      <span className="rivet absolute bottom-3 right-3" aria-hidden="true" />

      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center border border-hazard-400/50 bg-ink-900 text-hazard-400">
          {icon}
        </div>
        <span className="font-mono text-xs text-ink-500">
          {String(number).padStart(2, "0")}
        </span>
      </div>

      <h3 className="font-display text-xl font-bold text-concrete-50">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-concrete-300">
        {description}
      </p>
    </article>
  );
}

function StackChip({ name, icon }: { name: string; icon: StackIconName }) {
  return (
    <span className="inline-flex items-center gap-2 border border-ink-700 bg-ink-800 px-3 py-2 font-mono text-xs text-concrete-200 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] sm:text-sm">
      <StackIcon name={icon} />
      <span>{name}</span>
    </span>
  );
}

function StackIcon({ name }: { name: StackIconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-hazard-400"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect x="1.5" y="1.5" width="21" height="21" rx="2" stroke="currentColor" />
      <text
        x="12"
        y="15"
        textAnchor="middle"
        fill="currentColor"
        fontSize={name === "ts" ? "7" : "8"}
        fontFamily="monospace"
        fontWeight="700"
      >
        {stackIconLabels[name]}
      </text>
    </svg>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-col gap-1 border-b border-ink-700/50 pb-4 last:border-0 last:pb-0 sm:flex-row sm:gap-5">
      <span className="w-28 shrink-0 font-mono text-xs font-medium uppercase tracking-wider text-hazard-400 sm:pt-0.5">
        {label}
      </span>
      <span className="font-mono text-sm leading-relaxed text-concrete-300">
        {value}
      </span>
    </li>
  );
}

function MarqueeBlock() {
  return (
    <div className="flex shrink-0 items-center">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center">
          <span className="brand-glitch px-4 font-display text-4xl font-bold tracking-tight text-concrete-50 sm:px-6 sm:text-6xl lg:text-7xl">
            GYMFLOW
          </span>
          <WeightPlate />
        </div>
      ))}
    </div>
  );
}

function WeightPlate() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-hazard-400 sm:h-12 sm:w-12"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
    >
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" opacity="0.7" />
      <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function IconPlans() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10h8M8 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m16 12 2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSubscriptions() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 17h4M17 15v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 4v-4h-1A2.5 2.5 0 0 1 4 12.5v-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 8h8M8 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
