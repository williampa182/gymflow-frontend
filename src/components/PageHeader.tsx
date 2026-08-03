// Cabecera de página compartida del dashboard — unifica el patrón que solo
// el dashboard tenía (título display + subtítulo mono) y que el resto de
// páginas repetía a mano con layouts verticales distintos.
export function PageHeader({
  titulo,
  subtitulo,
  acciones,
}: {
  titulo: string;
  subtitulo?: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold text-concrete-100">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-concrete-300">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </div>
  );
}
