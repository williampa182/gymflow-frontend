// Estado vacío compartido para listados. Dos variantes que antes se
// mezclaban con el mismo texto: "sinDatos" (no hay nada todavía) y
// "sinResultados" (hay datos pero el filtro no encuentra nada).
export function EmptyState({
  mensaje,
  variante = "sinDatos",
}: {
  mensaje: string;
  variante?: "sinDatos" | "sinResultados";
}) {
  return (
    <div className="px-4 py-6 text-center">
      <p className="font-mono text-sm text-concrete-300">{mensaje}</p>
      {variante === "sinResultados" && (
        <p className="mt-1 text-xs text-concrete-300">Prueba ajustar el filtro.</p>
      )}
    </div>
  );
}
