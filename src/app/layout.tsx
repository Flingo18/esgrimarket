import type { Metadata } from "next";
import { Geist } from "next/font/google";

import Link from "next/link";

import { Encabezado } from "@/components/encabezado";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const DESCRIPCION =
  "Comprá y vendé equipamiento de esgrima usado en Argentina: floretes, " +
  "espadas, sables, caretas, chaquetillas y cables. Además, el calendario de " +
  "torneos de la FAE y la FECBA y el mapa de salas de todo el país.";

export const metadata: Metadata = {
  title: {
    default: "Esgrimarket — Compra y venta de equipamiento de esgrima",
    template: "%s · Esgrimarket",
  },
  description: DESCRIPCION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  // Sin esto, cada URL con filtros distintos parece una página nueva y
  // compiten entre sí en los resultados.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Esgrimarket",
    title: "Esgrimarket — Equipamiento de esgrima",
    description: DESCRIPCION,
  },
  twitter: { card: "summary_large_image" },
  keywords: [
    "esgrima", "equipamiento de esgrima", "florete", "espada", "sable",
    "careta de esgrima", "chaquetilla eléctrica", "esgrima Argentina",
    "esgrima Buenos Aires", "esgrima Rosario", "esgrima Córdoba",
    "esgrima usada", "torneos de esgrima", "salas de esgrima",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Encabezado />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-borde mt-16">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-texto-suave space-y-2">
            <p>
              Esgrimarket — hecho para la comunidad de esgrima de Argentina.
              Los precios en pesos son de referencia, calculados al dólar blue.
            </p>
            <p>
              No tenemos relación con las federaciones ni con los clubes. El
              calendario y el mapa los carga y los corrige la comunidad: son
              una guía, y lo oficial siempre es lo que dice la federación que
              organiza.
            </p>
            <p>
              <Link href="/privacidad" className="underline hover:text-texto">
                Privacidad
              </Link>
              {" · "}
              <Link href="/mapa" className="underline hover:text-texto">
                Mapa de salas
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
