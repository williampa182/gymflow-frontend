import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Esta regla marca como error patrones legítimos de fetching de datos
      // y guards de sesión/rol dentro de useEffect (ej. cargar /planes al
      // montar, o verificar localStorage al entrar al dashboard). Ambos son
      // exactamente el caso de uso que React documenta para useEffect:
      // sincronizar con un sistema externo (API, localStorage).
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
