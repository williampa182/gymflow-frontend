"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { loadSession, getRol, hasRole, logout } from "@/lib/auth";
import ChatWidget from "./_components/ChatWidget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [nombre, setNombre] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function verificarSesion() {
      const session = await loadSession();
      if (cancelado) return;

      if (!session) {
        router.replace("/login");
        return;
      }
      setNombre(session.nombre);
      setChecked(true);
    }

    verificarSesion();

    return () => {
      cancelado = true;
    };
  }, [router]);

  // Cierra el menú móvil al navegar a otra ruta
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-concrete-100">
        <p className="font-mono text-sm text-ink-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete-100 md:flex">
      {/* Barra superior — solo visible en mobile */}
      <div className="flex items-center justify-between border-b border-concrete-300 bg-ink-900 px-4 py-3 md:hidden">
        <span className="font-display text-xl font-bold tracking-tight text-concrete-50">
          GYMFLOW
        </span>
        <button
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-md text-concrete-100 hover:bg-white/5"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Overlay + drawer — solo en mobile, cuando está abierto */}
      {menuAbierto && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-ink-900/70"
            onClick={() => setMenuAbierto(false)}
          />
          <aside className="relative flex h-full w-64 flex-col bg-ink-900 text-concrete-100">
            <SidebarContent nombre={nombre} onNavigate={() => setMenuAbierto(false)} />
          </aside>
        </div>
      )}

      {/* Sidebar fijo — solo en desktop */}
      <aside className="hazard-edge-r hidden w-56 shrink-0 flex-col bg-ink-900 text-concrete-100 md:flex">
        <SidebarContent nombre={nombre} />
      </aside>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <ChatWidget />
    </div>
  );
}

function SidebarContent({ nombre, onNavigate }: { nombre: string | null; onNavigate?: () => void }) {
  const rol = getRol();
  const iniciales = obtenerIniciales(nombre);

  return (
    <>
      <div className="hidden border-b border-white/10 px-5 py-5 md:block">
        <span className="brand-glitch font-display text-2xl font-bold tracking-tight text-concrete-50">
          GYMFLOW
        </span>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-hazard-400 font-mono text-[10px] font-semibold text-ink-900">
            {iniciales}
          </span>
          <p className="truncate font-mono text-[11px] text-concrete-300">
            {nombre} · {rol}
          </p>
        </div>
      </div>

      <div className="border-b border-white/10 px-5 py-4 md:hidden">
        <p className="truncate font-mono text-xs text-concrete-300">
          {nombre} · {rol}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <NavLink href="/dashboard" label="Dashboard" icon={<IconGrid />} onNavigate={onNavigate} />
        <NavLink href="/dashboard/planes" label="Planes" icon={<IconClipboard />} onNavigate={onNavigate} />
        {hasRole("ADMIN") && (
          <NavLink href="/dashboard/usuarios" label="Usuarios" icon={<IconUsers />} onNavigate={onNavigate} />
        )}
        {hasRole("ADMIN") && (
          <NavLink href="/dashboard/suscripciones" label="Suscripciones" icon={<IconFolder />} onNavigate={onNavigate} />
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-concrete-300 transition hover:bg-white/5 hover:text-concrete-50"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

function obtenerIniciales(nombre: string | null): string {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/);
  const iniciales = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return iniciales.join("") || "?";
}

function NavLink({
  href,
  label,
  icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const activo = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
        activo
          ? "bg-hazard-400/10 text-hazard-400"
          : "text-concrete-300 hover:bg-white/5 hover:text-concrete-50"
      }`}
    >
      {activo && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-hazard-400" />
      )}
      <span className="shrink-0 opacity-85">{icon}</span>
      {label}
    </Link>
  );
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 8h14M3 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="3" y="4" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M4 4h12v9l-3 3H4V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 8h4M8 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
