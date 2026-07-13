import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Headers de seguridad HTTP. Antes de esto no había ninguno configurado
  // explícitamente (hallazgo 3.7 del THREAT_MODEL.md del backend, aplica
  // igual acá). Sin X-Frame-Options el sitio es embebible en un iframe
  // ajeno (clickjacking); sin HSTS la primera conexión de cada usuario es
  // vulnerable a downgrade HTTPS->HTTP en redes no confiables.
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
          {
            // CSP conservador: ajustar si se agregan fuentes/scripts
            // externos (ej. CDNs). frame-ancestors 'none' refuerza
            // X-Frame-Options para navegadores modernos.
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
