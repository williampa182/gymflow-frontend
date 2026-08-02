import { AuthShell } from "@/components/AuthShell";

export default function NotFoundPage() {
  return (
    <AuthShell
      titulo="Error 404"
      linkHref="/"
      linkLabel="Volver al inicio"
      linkVariant="button"
    >
      <div className="px-8 pt-10 text-center">
        <p className="font-display text-[5rem] font-bold leading-none text-hazard-400">
          404
        </p>
        <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-concrete-300">
          Placa no encontrada
        </p>
        <p className="mx-auto mt-5 max-w-[20rem] text-sm leading-relaxed text-concrete-300">
          Esa barra no está en la sala de máquinas. Revisa la ruta o vuelve al
          inicio.
        </p>
      </div>
    </AuthShell>
  );
}
