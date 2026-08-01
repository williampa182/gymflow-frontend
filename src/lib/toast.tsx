"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type TipoToast = "exito" | "error" | "info";

interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

interface ToastContextValue {
  toasts: Toast[];
  notificar: (tipo: TipoToast, mensaje: string) => void;
  quitar: (id: number) => void;
}

const DURACION_MS = 3500;

const ToastContext = createContext<ToastContextValue | null>(null);

// Sistema de notificaciones estilo "sala de máquinas": cero dependencias,
// cola de toasts con auto-dismiss y cierre manual. El provider vive en el
// layout del dashboard; useToast() consume el contexto desde cualquier
// página/componente del árbol.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Al desmontar el provider se limpian los timers pendientes (los toasts
  // en cola no deben setState sobre un árbol desmontado).
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const quitar = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const notificar = useCallback(
    (tipo: TipoToast, mensaje: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, tipo, mensaje }]);
      const timer = setTimeout(() => quitar(id), DURACION_MS);
      timersRef.current.set(id, timer);
    },
    [quitar]
  );

  const value = useMemo(
    () => ({ toasts, notificar, quitar }),
    [toasts, notificar, quitar]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() requiere <ToastProvider> en el árbol.");
  }
  return ctx;
}
