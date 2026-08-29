import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Encabezado } from "@/components/encabezado";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Esgrimarket — Compra y venta de equipamiento de esgrima",
    template: "%s · Esgrimarket",
  },
  description:
    "Marketplace de la comunidad de esgrima de Buenos Aires. Publicá lo que no usás, encontrá lo que buscás y coordiná por WhatsApp.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Encabezado />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-borde mt-16">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-texto-suave">
            Esgrimarket — hecho para la comunidad de esgrima de Buenos Aires.
            Los precios en pesos son de referencia, calculados al dólar blue.
          </div>
        </footer>
      </body>
    </html>
  );
}
