"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterRequest } from "@/types";
import { authErrorBanner } from "@/lib/ui";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterRequest>({
    nombre: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        // §11 (security-deep-dive-additional-findings.md): antes el 409 tenía
        // el mensaje hardcoded "Ese email ya está registrado.", lo que
        // revelaba la existencia del email incluso si el backend se cambiaba
        // a modo genérico (reveal-email-exists-on-register=false, ver
        // collab/aplicado/2026-07-16-decision-reveal-email-false.md). Ahora
        // leemos el message del body como ya hacíamos para los 400 — el
        // backend decide qué revelar, el frontend lo refleja sin asumir.
        const data = await res.json().catch(() => null);
        if (res.status === 409) {
          setError(
            data?.message ??
              "No se pudo completar el registro. Si ya tenés una cuenta, intentá iniciar sesión."
          );
        } else if (res.status === 400) {
          setError(
            data?.message ??
              "Revisa los datos: el nombre, email y contraseña son obligatorios."
          );
        } else {
          setError(
            data?.message ?? "No se pudo completar el registro. Intenta de nuevo."
          );
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rubber-floor px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="brand-glitch font-display text-4xl font-bold tracking-tight text-concrete-50">
            GYMFLOW
          </span>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-hazard-400">
            Crear cuenta
          </p>
        </div>

        <div className="relative overflow-hidden rounded-none border-2 border-ink-700 bg-ink-800 shadow-[8px_8px_0_0_rgba(0,0,0,0.6)]">
          <span className="rivet left-3 top-3" />
          <span className="rivet right-3 top-3" />
          <span className="rivet bottom-3 left-3" />
          <span className="rivet bottom-3 right-3" />

          <div className="hazard-stripe h-1.5" />
          <form onSubmit={handleSubmit} className="space-y-4 p-8">
            <div>
              <label
                htmlFor="nombre"
                className="mb-1 block text-sm font-semibold text-concrete-100"
              >
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="name"
                required
                disabled={loading}
                value={form.nombre}
                onChange={handleChange}
                className="auth-input w-full px-3 py-2 text-sm"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-semibold text-concrete-100"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={form.email}
                onChange={handleChange}
                className="auth-input w-full px-3 py-2 text-sm"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-semibold text-concrete-100"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                disabled={loading}
                value={form.password}
                onChange={handleChange}
                className="auth-input w-full px-3 py-2 text-sm"
                placeholder="Mínimo 12 caracteres"
              />
              <p className="mt-1 text-xs text-concrete-300">
                Mínimo 12 caracteres. Evita contraseñas comunes.
              </p>
            </div>

            {error && <p className={authErrorBanner}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="auth-button-primary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide"
            >
              {loading && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            <p className="text-center text-sm text-concrete-300">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-semibold text-hazard-400 underline underline-offset-2 hover:text-hazard-500">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
