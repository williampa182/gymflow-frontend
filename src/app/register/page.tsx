"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterRequest } from "@/types";
import { authErrorBanner } from "@/lib/ui";
import { usePageTitle } from "@/lib/usePageTitle";
import { AuthShell } from "@/components/AuthShell";
import { ButtonSpinner } from "@/components/ButtonSpinner";

// P2.3 — mismo algoritmo que el prototipo (assets/gymflow.js escoreContrasena):
// suma +1 por longitud >=8, +1 por >=12, +1 por mayúscula+minúscula, +1 por
// dígito y +1 por símbolo; techo de 4 (cuatro segmentos).
const NIVELES_FORTALEZA = ["", "Débil", "Aceptable", "Buena", "Muy fuerte"];
const COLOR_SEGMENTO = ["", "bg-rust-600", "bg-hazard-500", "bg-hazard-400", "bg-moss-600"];

function escoreContrasena(value: string): number {
  let s = 0;
  if (value.length >= 8) s++;
  if (value.length >= 12) s++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) s++;
  if (/\d/.test(value)) s++;
  if (/[^A-Za-z0-9]/.test(value)) s++;
  return Math.min(s, 4);
}

export default function RegisterPage() {
  usePageTitle("Crear cuenta");
  const router = useRouter();

  const [form, setForm] = useState<RegisterRequest>({
    nombre: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const nivelFortaleza = escoreContrasena(form.password);

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
        const data = await res.json().catch(() => null);
        if (res.status === 409) {
          // §11 (security-deep-dive-additional-findings.md): el mensaje lo
          // decide el backend (reveal-email-exists-on-register=false, ver
          // collab/aplicado/2026-07-16-decision-reveal-email-false.md) — el
          // frontend lo refleja sin asumir ni hardcodear.
          setError(
            data?.message ??
              "No se pudo completar el registro. Si ya tienes una cuenta, intenta iniciar sesión."
          );
        } else if (res.status === 422 || res.status === 400) {
          setError(
            data?.message ??
              "Revisa los datos: el nombre, email y contraseña son obligatorios."
          );
        } else if (res.status === 429) {
          setError(
            data?.message ?? "Demasiados intentos. Espera un momento."
          );
        } else {
          setError(
            data?.message ??
              "No se pudo completar el registro. Intenta de nuevo."
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
      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-8">
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
          <div className="relative">
            <input
              id="password"
              name="password"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              disabled={loading}
              value={form.password}
              onChange={handleChange}
              className="auth-input w-full px-3 py-2 pr-11 text-sm"
              placeholder="Mínimo 12 caracteres"
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
          <div className="mt-1 flex gap-[0.3rem]" role="presentation" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 transition-colors duration-200 ${
                  i < nivelFortaleza ? COLOR_SEGMENTO[nivelFortaleza] : "bg-ink-700"
                }`}
              />
            ))}
          </div>
          <p id="strength-label" aria-live="polite" className="mt-1 font-mono text-xs text-concrete-300">
            {form.password ? NIVELES_FORTALEZA[nivelFortaleza] : "Mínimo 12 caracteres. Evita contraseñas comunes."}
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