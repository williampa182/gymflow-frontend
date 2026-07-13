"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, getNombre, getRol, hasRole, logout } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [nombre, setNombre] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setNombre(getNombre());
    setChecked(true);
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
      <aside className="hidden w-56 shrink-0 flex-col bg-ink-900 text-concrete-100 md:flex">
        <SidebarContent nombre={nombre} />
      </aside>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({ nombre, onNavigate }: { nombre: string | null; onNavigate?: () => void }) {
  return (
    <>
      <div className="hidden border-b border-white/10 px-5 py-5 md:block">
        <span className="font-display text-2xl font-bold tracking-tight text-concrete-50">
          GYMFLOW
        </span>
        <p className="mt-0.5 truncate font-mono text-[11px] text-concrete-300">
          {nombre} · {getRol()}
        </p>
      </div>

      <div className="border-b border-white/10 px-5 py-4 md:hidden">
        <p className="truncate font-mono text-xs text-concrete-300">
          {nombre} · {getRol()}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <NavLink href="/dashboard" label="Dashboard" onNavigate={onNavigate} />
        <NavLink href="/dashboard/planes" label="Planes" onNavigate={onNavigate} />
        {hasRole("ADMIN") && (
          <NavLink href="/dashboard/usuarios" label="Usuarios" onNavigate={onNavigate} />
        )}
        {hasRole("ADMIN") && (
          <NavLink href="/dashboard/suscripciones" label="Suscripciones" onNavigate={onNavigate} />
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

function NavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const activo = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative rounded-md px-3 py-2 text-sm font-medium transition ${
        activo
          ? "bg-white/5 text-hazard-400"
          : "text-concrete-300 hover:bg-white/5 hover:text-concrete-50"
      }`}
    >
      {activo && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-hazard-400" />
      )}
      {label}
    </Link>
  );
}
