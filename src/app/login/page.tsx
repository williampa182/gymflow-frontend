"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginRequest } from "@/types";
import { input, buttonPrimary, errorBanner } from "@/lib/ui";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-rubber-floor px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-4xl font-bold tracking-tight text-concrete-50">
            GYMFLOW
          </span>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-hazard-400">
            Panel de control
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-ink-800 shadow-2xl shadow-black/40">
          <div className="hazard-stripe h-1.5" />
          <form onSubmit={handleSubmit} className="space-y-4 p-8">
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
                value={form.email}
                onChange={handleChange}
                className={input}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-concrete-100">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                className={input}
                placeholder="••••••••"
              />
            </div>

            {error && <p className={errorBanner}>{error}</p>}

            <button type="submit" disabled={loading} className={`${buttonPrimary} w-full`}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
