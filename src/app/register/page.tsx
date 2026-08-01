"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterRequest } from "@/types";
import { authErrorBanner } from "@/lib/ui";
import { usePageTitle } from "@/lib/usePageTitle";
import { AuthShell } from "@/components/AuthShell";
import { ButtonSpinner } from "@/components/ButtonSpinner";

export default function RegisterPage() {
  usePageTitle("Registro");
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
    <AuthShell
      titulo="Crear cuenta"
      linkTexto="¿Ya tienes cuenta?"
      linkHref="/login"
      linkLabel="Inicia sesión"
    >
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
          {loading && <ButtonSpinner />}
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </AuthShell>
  );
}
