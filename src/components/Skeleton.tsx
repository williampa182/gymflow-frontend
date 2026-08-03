"use client";

// Skeletons de carga con la paleta existente (concrete sobre concrete),
// sin dependencias. Cada composición imita las alturas del contenido real
// para evitar saltos de layout al resolver el fetch.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-ink-700 ${className}`} />;
}

// Fila de tabla (usuarios/suscripciones) — vive dentro de tableWrap.
export function SkeletonFilas({ filas = 5 }: { filas?: number }) {
  return (
    <div className="px-4 py-1">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="hidden h-4 w-1/5 sm:block" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="ml-auto h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// Grid de tarjetas de plan — imita la card con franja hazard superior.
export function SkeletonTarjetas({ tarjetas = 6 }: { tarjetas?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: tarjetas }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-ink-700 border-t-4 border-t-hazard-400 bg-ink-800 p-5"
        >
          <Skeleton className="mb-3 h-5 w-2/3" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="mb-2 h-8 w-1/2" />
          <Skeleton className="mb-4 h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// Placas de estadísticas del dashboard — imita PlateStat.
export function SkeletonStats({ tarjetas = 4 }: { tarjetas?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: tarjetas }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border-2 border-ink-700 bg-ink-900 p-5"
        >
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="h-7 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
