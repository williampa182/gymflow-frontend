import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Headers de seguridad HTTP. Antes de esto no había ninguno configurado
  // explícitamente (hallazgo 3.7 del THREAT_MODEL.md del backend, aplica
  // igual acá). Sin X-Frame-Options el sitio es embebible en un iframe
  // ajeno (clickjacking); sin HSTS la primera conexión de cada usuario es
  // vulnerable a downgrade HTTPS->HTTP en redes no confiables.
  //
  // M2 (2026-08-04): la CSP completa con nonce se sirve desde proxy.ts
  // porque el nonce es por request; sacada de acá para evitar doble header
  // (los browsers ANDean ambas políticas). frame-ancestors 'none' vive
  // ahora dentro de esa CSP.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
