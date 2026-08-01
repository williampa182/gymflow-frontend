import { useEffect, useRef } from "react";

// Focus trap + cierre con Escape + restauración de foco para diálogos
// (modal de planes, drawer móvil). Se usa con un ref sobre el contenedor:
//
//   const ref = useFocusTrap(abierto, cerrar);
//   if (abierto) return <div ref={ref}>...</div>;
//
// - Al abrir: guarda el elemento activo y enfoca el primer elemento
//   enfocable del panel.
// - Tab/Shift+Tab: el foco queda atrapado dentro del panel.
// - Escape: llama a onCerrar.
// - Al cerrar: restaura el foco al elemento que abrió el diálogo.

const FOCUSABLES_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useFocusTrap(abierto: boolean, onCerrar: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  // onCerrar en ref para que el effect dependa solo de `abierto` y no se
  // re-ejecute (ni robe el foco) en cada re-render del diálogo.
  const onCerrarRef = useRef(onCerrar);
  useEffect(() => {
    onCerrarRef.current = onCerrar;
  });

  useEffect(() => {
    if (!abierto) return;

    const prev = document.activeElement as HTMLElement | null;
    const root = ref.current;
    if (!root) return;

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLES_SELECTOR));

    focusables()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCerrarRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const primero = items[0];
      const ultimo = items[items.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prev?.focus();
    };
  }, [abierto]);

  return ref;
}
