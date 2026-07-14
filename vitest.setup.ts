// Setup global de Vitest para el frontend.
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Limpia el DOM y los mocks entre tests para evitar fugas de estado.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom no implementa matchMedia. Ningún componente de GymFlow lo usa hoy,
// pero RTL lo invoca al renderizar componentes que tocan el layout. Defensivo.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}
