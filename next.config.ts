import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    // Las fotos viven en el bucket público de Supabase.
    remotePatterns: supabase
      ? [{ protocol: "https", hostname: new URL(supabase).hostname, pathname: "/storage/v1/object/public/**" }]
      : [],

    // Supabase sirve las fotos con `cache-control: no-cache`, así que sin esto
    // Vercel volvía a bajar y re-transformar la MISMA imagen todo el tiempo:
    // 36 fotos habían gastado 4.000 transformaciones. Este mínimo manda por
    // encima del encabezado de origen, así que también arregla las que ya
    // estaban subidas sin caché.
    minimumCacheTTL: 31_536_000,

    // Un ancho por cada tamaño que el diseño pide de verdad. Los de arriba de
    // 1200 no servían para nada: las fotos se comprimen a 1400px como máximo
    // antes de subirse, así que pedir 1920 o 3840 devolvía la misma imagen
    // contada como otra transformación.
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],

    // Sólo WebP. Con AVIF además, cada foto se transforma dos veces —el doble
    // de consumo— para ganar unos kilobytes sobre fotos que ya vienen
    // comprimidas desde el navegador.
    formats: ["image/webp"],

    // Una sola calidad: cada valor distinto es una transformación aparte.
    qualities: [75],
  },
};

export default nextConfig;
