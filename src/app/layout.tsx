import type { Metadata } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Condensada y bold: números y encabezados, evoca el rotulado troquelado
// de discos/placas de equipo de gimnasio.
const displayFont = Oswald({
  variable: "--font-oswald",
  weight: ["600", "700"],
  subsets: ["latin"],
});

// Cuerpo de texto: legible en tablas y formularios densos de datos.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Datos: IDs, fechas, precios — como el display de un kiosco de check-in.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GymFlow",
  description: "Gestión de gimnasio: planes, usuarios y suscripciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
