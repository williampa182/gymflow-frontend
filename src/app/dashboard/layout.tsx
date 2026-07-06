"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, getNombre, getRol, hasRole, logout } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setNombre(getNombre());
    setChecked(true);
  }, [router]);

  // Evita el "flash" de contenido protegido mientras se verifica la sesión
  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-gray-900">GymFlow</span>
            <span className="ml-3 text-sm text-gray-500">
              {nombre} · {getRol()}
            </span>
          </div>
          <button
            onClick={logout}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
          >
            Cerrar sesión
          </button>
        </div>

        <nav className="mx-auto mt-3 flex max-w-6xl gap-1">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/dashboard/planes" label="Planes" />
          {hasRole("ADMIN") && <NavLink href="/dashboard/usuarios" label="Usuarios" />}
          {hasRole("ADMIN") && <NavLink href="/dashboard/suscripciones" label="Suscripciones" />}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const activo = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        activo
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}
