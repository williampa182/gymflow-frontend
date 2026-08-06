# GymFlow — Frontend

[![Frontend CI](https://github.com/williampa182/gymflow-frontend/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/williampa182/gymflow-frontend/actions/workflows/frontend-ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)

Frontend de GymFlow, un sistema de gestión de gimnasios: registro/login,
planes, suscripciones y un dashboard administrativo. Sigue un sistema de
diseño propio ("sala de máquinas" industrial — paleta concrete-dark,
acentos hazard-amber, remaches, sombras duras) en vez de un theme
genérico de componente library.

Proyecto de portafolio construido con un flujo de colaboración
multi-agente (ver `AGENTS.md`), documentado en detalle para servir también
como referencia de proceso, no solo de código.

**Demo en vivo:** [gymflow-frontend-production.up.railway.app](https://gymflow-frontend-production.up.railway.app)
· **Backend:** [gymflow-backend](https://github.com/williampa182/gymflow-backend) ·
[demo API](https://gymflow-backend-production-0a1b.up.railway.app)

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Axios** para el cliente HTTP, con proxy propio (`proxy.ts`, no
  `middleware.ts`) hacia el backend
- **Recharts** para las visualizaciones del dashboard admin
- **Vitest** + Testing Library para tests unitarios, **Playwright** para
  e2e
- **GitHub Actions** para CI/CD, despliegue en **Railway**

## Decisiones técnicas

- **Cookie httpOnly en vez de localStorage para el JWT**: el token de
  sesión no es accesible desde JavaScript en el cliente, lo que reduce la
  superficie de ataque XSS. El trade-off es manejar la sesión vía
  proxy/servidor en vez de leerla directamente en el cliente.
- **`proxy.ts` en vez de `middleware.ts`**: la convención de Next.js 16
  cambió el mecanismo de proxy/rewrite server-side; usar el archivo
  equivocado hace que las llamadas al backend fallen silenciosamente en
  ciertos casos — se detectó y corrigió durante el desarrollo.
- **Sistema de diseño propio en vez de una UI library genérica**: para un
  proyecto de portafolio, un tema por defecto de shadcn/MUI se ve como el
  de cualquier otro proyecto. La estética "sala de máquinas" es una
  decisión deliberada de identidad visual.

## Features

- Registro y login con manejo de sesión vía cookie httpOnly
- CRUD de planes y suscripciones (según rol)
- Dashboard administrativo con métricas (gráficos con Recharts)
- Asistencias (Fase 5): check-in con fecha, carnet con QR y resumen semanal
- Chat de soporte integrado (`ChatWidget` flotante) que consume
  `POST /api/chat` del backend (RAG simple sobre los planes + guía del
  dashboard), con persistencia de la conversación en `sessionStorage`,
  aviso de proveedor externo y kill-switch del lado del servidor
- Landing page con las decisiones técnicas del proyecto explicadas para
  quien lo revisa

## Empezar en local

Requisitos: Node.js 20+, y el backend de GymFlow corriendo (ver
[gymflow-backend](https://github.com/williampa182/gymflow-backend)).

```bash
# Instalar dependencias
npm install

# Copiar y ajustar las variables de entorno
cp .env.example .env

# Correr en modo desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Tests

```bash
# Unitarios
npm test

# End-to-end (Playwright)
npm run test:e2e
```

## Documentación adicional

- `AGENTS.md` — convenciones para agentes de IA que colaboran en este
  repo.

## Seguridad

Este proyecto pasó por una auditoría de seguridad dedicada en conjunto
con el backend (ver README de
[gymflow-backend](https://github.com/williampa182/gymflow-backend#seguridad)
para el detalle completo). En el frontend, el punto central fue el manejo
de sesión vía cookie httpOnly en vez de almacenamiento accesible por
JavaScript, además de la restricción de visibilidad de planes inactivos
para usuarios no admin y la CSP completa con nonce por request servida
desde `proxy.ts` (M2, `script-src 'self' 'nonce-…' 'strict-dynamic'`,
verificado con tests y e2e de headers).
