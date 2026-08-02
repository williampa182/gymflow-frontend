"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginRequest } from "@/types";
import { authErrorBanner } from "@/lib/ui";
import { usePageTitle } from "@/lib/usePageTitle";
import { AuthShell } from "@/components/AuthShell";
import { ButtonSpinner } from "@/components/ButtonSpinner";

export default function LoginPage() {
  usePageTitle("Iniciar sesión");
  const router = useRouter();

  const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("Email o contraseña incorrectos.");
        } else if (res.status === 429) {
          const data = await res.json().catch(() => null);
          setError(data?.message ?? "Demasiados intentos. Espera un momento.");
        } else {
          const data = await res.json().catch(() => null);
          setError(data?.message ?? "No se pudo conectar con el servidor. Intenta de nuevo.");
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
    <AuthShell
      titulo="Iniciar sesión"
      linkTexto="¿No tienes cuenta?"
      linkHref="/register"
      linkLabel="Regístrate"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-8">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-concrete-100">
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
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-concrete-100">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={loading}
              value={form.password}
              onChange={handleChange}
              className="auth-input w-full px-3 py-2 pr-11 text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-[0.35rem] top-1/2 inline-flex -translate-y-1/2 items-center justify-center border-0 bg-transparent p-[0.35rem] text-concrete-300 transition-colors hover:text-hazard-400 focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-hazard-400 disabled:cursor-not-allowed disabled:opacity-55"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              disabled={loading}
              onClick={() => {
                setShowPassword((v) => !v);
                passwordRef.current?.focus();
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        </div>

        {error && <p className={authErrorBanner}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="auth-button-primary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide"
        >
          {loading && <ButtonSpinner />}
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </AuthShell>
  );
}
