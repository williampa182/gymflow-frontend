"use client";

import { useFocusTrap } from "@/lib/useFocusTrap";
import {
  buttonDanger,
  buttonSecondaryDark,
  modalBodyDark as modalBody,
  modalPanelDark,
} from "@/lib/ui";

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  onCancelar: () => void;
  onConfirmar: () => void;
  confirmando?: boolean;
}

export function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  onCancelar,
  onConfirmar,
  confirmando = false,
}: ConfirmDialogProps) {
  const ref = useFocusTrap(abierto, onCancelar);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-ink-900/60 px-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-titulo"
        className={modalPanelDark}
      >
        <span className="rivet left-3 top-3" />
        <span className="rivet right-3 top-3" />
        <span className="rivet bottom-3 left-3" />
        <span className="rivet bottom-3 right-3" />
        <div className="hazard-stripe h-1" />

        <div className={modalBody}>
          <h2
            id="confirm-dialog-titulo"
            className="mb-2 font-display text-xl font-bold text-concrete-100"
          >
            {titulo}
          </h2>
          <p className="text-sm text-concrete-200">{mensaje}</p>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onCancelar} className={buttonSecondaryDark}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={confirmando}
              className={buttonDanger}
            >
              {confirmando ? "…" : textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}