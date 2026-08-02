import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  titulo,
  linkTexto,
  linkHref,
  linkLabel,
  linkVariant = "text",
  children,
}: {
  titulo: string;
  linkTexto?: string;
  linkHref: string;
  linkLabel: string;
  linkVariant?: "text" | "button";
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-rubber-floor px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="brand-glitch font-display text-4xl font-bold tracking-tight text-concrete-50">
            GYMFLOW
          </span>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-hazard-400">
            {titulo}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-none border-2 border-ink-700 bg-ink-800 shadow-[8px_8px_0_0_rgba(0,0,0,0.6)]">
          <span className="rivet left-3 top-3" />
          <span className="rivet right-3 top-3" />
          <span className="rivet bottom-3 left-3" />
          <span className="rivet bottom-3 right-3" />

          <div className="hazard-stripe h-1.5" />
          {children}

          {linkVariant === "button" ? (
            <div className="px-8 pb-8">
              <Link
                href={linkHref}
                className="auth-button-primary flex w-full items-center justify-center px-4 py-2.5 text-sm font-semibold uppercase tracking-wide"
              >
                {linkLabel}
              </Link>
            </div>
          ) : (
            <p className="px-8 pb-8 text-center text-sm text-concrete-300">
              {linkTexto}{" "}
              <Link
                href={linkHref}
                className="font-semibold text-hazard-400 underline underline-offset-2 hover:text-hazard-500"
              >
                {linkLabel}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
