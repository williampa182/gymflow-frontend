<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GymFlow Frontend — Contexto para agentes de código

Este proyecto se desarrolla con ayuda de múltiples agentes de IA en paralelo
(Claude, Codex, GLM-5.2 vía Z Code) coordinados por William. Leé esto antes
de tocar cualquier código.

## Punto de entrada obligatorio

**Antes de proponer o aplicar cualquier cambio, leé en este orden:**

1. `collab/MAPA.md` (en `C:\proyectos\gymflow\`) — índice de navegación; el
   estado vigente consolidado vive en `collab/estado/ACTUAL.md`. Lo terminado
   se archiva en `collab/historial/` (`aplicado/`, `handoffs/`,
   `propuestas-cerradas/`).
2. `../gymflow-backend/docs/THREAT_MODEL.md` — estado de verdad de
   seguridad (aplica también a decisiones de frontend como CSRF/headers).
3. `../gymflow-backend/docs/ARCHITECTURE.md` — decisiones de diseño.
4. El sistema de diseño "sala de máquinas" ya existe en `src/app/globals.css`
   y `src/lib/ui.ts` — reutilizá esos tokens/helpers, no inventes paleta
   nueva ni redefinas colores.

## Regla de oro del flujo de trabajo

**No apliques cambios directo al código sin dejar rastro.** Generá una
propuesta en `collab/propuestas/<tu-nombre>/`, otra herramienta o Claude la
revisa contra el código real, William decide si se aplica, y queda
registrado en `collab/historial/aplicado/`.

## Reglas de roles y commits (2026-08-05)

- **Claude es el supervisor/jefe y el committer principal** de los repos: el
  flujo normal es que OpenCode/otros agentes dejen el trabajo listo en disco
  (working tree commiteado) y Claude revise y pushee.
- **Nunca `git commit` ni `git push` sin aprobación explícita de William**,
  aunque el prompt de la sesión no lo repita — es el comportamiento por
  defecto exigido en este repo. OpenCode solo commitea/pushea cuando William
  lo aprueba explícitamente en la sesión por necesidad operativa.

## Buena práctica ya demostrada en este proyecto

La primera propuesta de GLM-5.2 (dashboard ADMIN) verificó cada afirmación
de diseño contra el código real (archivo + línea) antes de proponer nada, y
eso la hizo confiable en la revisión cruzada. Seguí ese mismo estándar: no
afirmes que algo "ya existe" o "sigue tal patrón" sin haberlo leído primero.

## Herramientas del ecosistema

- **Claude** (Anthropic) — coordina el flujo de `collab/`, acceso vía Filesystem MCP limitado a `C:\proyectos\gymflow\`.
- **Codex** (OpenAI) — acceso total a la máquina de William, plugin "Codex Security", conectores GitHub/Context7/Superpowers.
- **GLM-5.2 vía Z Code** (Zhipu AI) — vos. Fuerte en frontend, modo Max (1M tokens de contexto).
- **ChatGPT** (chat, sin acceso a archivos) — tercera opinión puntual, ver `collab/opiniones-externas/`.

## Diagramas de flujo

Si hace falta visualizar algo (flujo de datos entre el proxy y el backend,
arquitectura de componentes), generá el diagrama como bloque Mermaid dentro
de un `.md` en `../gymflow-backend/docs/diagrams/` — texto plano, sin
formatos propietarios.

## Obsidian

William tiene `C:\proyectos\gymflow\` abierto como bóveda de Obsidian, con
`collab/MAPA.md` como nodo central del grafo. Todo `.md` nuevo de `collab/`
se archiva en su carpeta correspondiente de `historial/` (o `propuestas/` si
es activa) con link relativo Markdown estándar (no wikilinks `[[...]]`);
`MAPA.md` solo enlaza a la estructura y al estado vigente, no a cada archivo
nuevo.

## Stack

Next.js (App Router) + React 19 + Tailwind v4 + TypeScript. JWT en cookie
httpOnly, proxeado por `src/app/api/backend/[...path]/route.ts` hacia el
backend Spring Boot.
