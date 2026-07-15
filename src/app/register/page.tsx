"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterRequest } from "@/types";
import { input, buttonPrimary, errorBanner } from "@/lib/ui";

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
        if (res.status === 409) {
          setError("Ese email ya está registrado.");
        } else if (res.status === 400) {
          const data = await res.json().catch(() => null);
          setError(
            data?.message ??
              "Revisa los datos: el nombre, email y contraseña son obligatorios."
          );
        } else {
          const data = await res.json().catch(() => null);
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
          <span className="font-display text-4xl font-bold tracking-tight text-concrete-50">
            GYMFLOW
          </span>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-hazard-400">
            Crear cuenta
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-ink-800 shadow-2xl shadow-black/40">
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
                value={form.nombre}
                onChange={handleChange}
                className={input}
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
                value={form.email}
                onChange={handleChange}
                className={input}
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
                value={form.password}
                onChange={handleChange}
                className={input}
                placeholder="Mínimo 12 caracteres"
              />
              <p className="mt-1 text-xs text-concrete-400">
                Mínimo 12 caracteres. Evita contraseñas comunes.
              </p>
            </div>

            {error && <p className={errorBanner}>{error}</p>}

            <button type="submit" disabled={loading} className={`${buttonPrimary} w-full`}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            <p className="text-center text-sm text-concrete-400">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-medium text-hazard-400 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
