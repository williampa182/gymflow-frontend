"use client";

import { useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import api from "@/lib/api";
import { buttonPrimary } from "@/lib/ui";
import type { ChatRequestDTO, ChatResponseDTO } from "@/types";

const MAX_MENSAJE = 2000;

interface Mensaje {
  id: string;
  rol: "usuario" | "asistente";
  texto: string;
}

export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes, enviando]);

  async function enviar() {
    const mensaje = texto.trim();
    if (!mensaje || mensaje.length > MAX_MENSAJE || enviando) return;

    const propio: Mensaje = { id: crypto.randomUUID(), rol: "usuario", texto: mensaje };
    setMensajes((prev) => [...prev, propio]);
    setTexto("");
    setError(null);
    setEnviando(true);

    try {
      const body: ChatRequestDTO = { mensaje };
      const { data } = await api.post<ChatResponseDTO>("/chat", body);
      setMensajes((prev) => [
        ...prev,
        { id: crypto.randomUUID(), rol: "asistente", texto: data.respuesta },
      ]);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const status = axiosErr.response?.status;
      const backendMsg = axiosErr.response?.data?.message;
      if (status === 429 || status === 503) {
        setError(backendMsg ?? "El servicio de soporte no está disponible en este momento.");
      } else {
        setError("No se pudo enviar tu mensaje. Intenta de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar chat de soporte" : "Abrir chat de soporte"}
        aria-expanded={abierto}
        className="fixed bottom-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-hazard-500 text-ink-900 shadow-[3px_3px_0_0_rgba(28,29,32,0.35)] transition hover:bg-hazard-400 md:bottom-6 md:right-6"
      >
        {abierto ? <IconClose /> : <IconChat />}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Chat de soporte GymFlow"
          className="fixed bottom-20 right-4 left-4 z-20 flex max-h-[70vh] flex-col overflow-hidden rounded-lg border-2 border-concrete-300 bg-concrete-50 shadow-[6px_6px_0_0_rgba(28,29,32,0.25)] sm:left-auto sm:right-6 sm:w-96 md:bottom-24"
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-ink-900 px-4 py-3">
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-concrete-50">
                Soporte GYMFLOW
              </p>
              <p className="font-mono text-[10px] text-concrete-300">
                Preguntá sobre planes y suscripciones
              </p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="flex h-7 w-7 items-center justify-center rounded-md text-concrete-300 hover:bg-white/5 hover:text-concrete-50"
            >
              <IconClose small />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {mensajes.length === 0 && (
              <p className="font-mono text-xs text-ink-500">
                Hola. Preguntame algo sobre los planes de GymFlow.
              </p>
            )}
            {mensajes.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                  m.rol === "usuario"
                    ? "ml-auto bg-hazard-400/15 text-ink-900"
                    : "bg-concrete-100 text-ink-700"
                }`}
              >
                {m.rol === "asistente" ? renderizarMensaje(m.texto) : m.texto}
              </div>
            ))}
            {enviando && (
              <div className="max-w-[85%] rounded-md bg-concrete-100 px-3 py-2 text-sm text-ink-500">
                Escribiendo…
              </div>
            )}
          </div>

          {error && (
            <p className="border-t border-rust-600/30 bg-rust-100 px-4 py-2 text-xs text-rust-700">
              {error}
            </p>
          )}

          <div className="border-t border-concrete-300 bg-concrete-50 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, MAX_MENSAJE))}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Escribí tu pregunta..."
                aria-label="Mensaje para soporte"
                className="input-plate max-h-24 flex-1 resize-none rounded-md px-3 py-2 text-sm text-ink-900 outline-none"
              />
              <button
                onClick={enviar}
                disabled={enviando || texto.trim().length === 0}
                className={`${buttonPrimary} shrink-0`}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Gemini responde en Markdown básico (**negrita**, listas con "* "), pero
// el widget no tenía ningún parser — se veían los asteriscos literales y
// todo el texto pegado en un solo bloque. Este parser cubre justo lo que el
// prompt de ChatService.java puede producir (negrita + líneas/viñetas), sin
// sumar una librería completa de Markdown (react-markdown) para tan poco, y
// sin dangerouslySetInnerHTML — construye elementos React directamente, no
// inyecta HTML crudo de una respuesta del LLM.
// Una fila de tabla markdown tiene al menos un "|"; la fila separadora
// (segunda fila del bloque) es solo guiones, espacios, ":" y "|", p.ej.
// "|---|:---:|". Se exige esa separadora para no confundir un "|" suelto
// dentro de una oración normal con el inicio de una tabla.
const ES_FILA_TABLA = /\|/;
const ES_SEPARADOR_TABLA = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/;

function renderizarMensaje(texto: string) {
  const lineas = texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);

  const bloques: Array<{ tipo: "texto"; lineas: string[] } | { tipo: "tabla"; lineas: string[] }> = [];
  let i = 0;
  while (i < lineas.length) {
    const esInicioTabla =
      ES_FILA_TABLA.test(lineas[i]) &&
      i + 1 < lineas.length &&
      ES_SEPARADOR_TABLA.test(lineas[i + 1]) &&
      ES_FILA_TABLA.test(lineas[i + 1]);

    if (esInicioTabla) {
      const filas = [lineas[i]];
      let j = i + 2;
      while (j < lineas.length && ES_FILA_TABLA.test(lineas[j])) {
        filas.push(lineas[j]);
        j++;
      }
      bloques.push({ tipo: "tabla", lineas: filas });
      i = j;
    } else {
      const ultimo = bloques[bloques.length - 1];
      if (ultimo && ultimo.tipo === "texto") {
        ultimo.lineas.push(lineas[i]);
      } else {
        bloques.push({ tipo: "texto", lineas: [lineas[i]] });
      }
      i++;
    }
  }

  return (
    <div className="space-y-2">
      {bloques.map((bloque, bi) =>
        bloque.tipo === "tabla" ? (
          <TablaMensaje key={bi} filas={bloque.lineas} />
        ) : (
          <div key={bi} className="space-y-1.5">
            {bloque.lineas.map((linea, i) => {
              const esItem = /^\*\s+/.test(linea);
              const contenido = linea.replace(/^\*\s+/, "");
              return (
                <p key={i} className={esItem ? "pl-3" : undefined}>
                  {esItem && "• "}
                  {renderizarNegritas(contenido)}
                </p>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function partirFila(fila: string): string[] {
  return fila
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((celda) => celda.trim());
}

function TablaMensaje({ filas }: { filas: string[] }) {
  // filas[0] = encabezado; la separadora ya fue descartada al agrupar el bloque.
  const encabezado = partirFila(filas[0]);
  const datos = filas.slice(1).map(partirFila);

  return (
    <div className="overflow-x-auto rounded-md border border-concrete-300">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-ink-900 text-concrete-50">
            {encabezado.map((celda, i) => (
              <th key={i} className="border-b border-concrete-300 px-2 py-1.5 text-left font-display font-semibold">
                {renderizarNegritas(celda)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, i) => (
            <tr key={i} className={i % 2 === 1 ? "bg-concrete-100/60" : undefined}>
              {fila.map((celda, j) => (
                <td key={j} className="border-b border-concrete-300/60 px-2 py-1.5 align-top">
                  {renderizarNegritas(celda)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderizarNegritas(texto: string) {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((parte) => parte.length > 0)
    .map((parte, i) =>
      parte.startsWith("**") && parte.endsWith("**") ? (
        <strong key={i}>{parte.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{parte}</span>
      )
    );
}

function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H8l-4 3v-3H3a1 1 0 01-1-1V5a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClose({ small }: { small?: boolean }) {
  const size = small ? 14 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
