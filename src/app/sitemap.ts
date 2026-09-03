import type { MetadataRoute } from "next";

import { crearClienteServidor } from "@/lib/supabase/server";

const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? "https://esgrimarket.com.ar";

/**
 * Le dice a Google qué páginas existen sin que tenga que descubrirlas
 * siguiendo enlaces. Incluye cada publicación activa: son las páginas con
 * contenido propio y las que alguien podría buscar por nombre.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fijas: MetadataRoute.Sitemap = [
    { url: SITIO, changeFrequency: "daily", priority: 1 },
    { url: `${SITIO}/torneos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITIO}/mapa`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${SITIO}/comprar-equipamiento-esgrima-argentina`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: `${SITIO}/como-funciona`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITIO}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("publicaciones")
      .select("id, actualizado_en")
      .limit(1000);

    const publicaciones: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url: `${SITIO}/p/${p.id}`,
      lastModified: new Date(p.actualizado_en),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...fijas, ...publicaciones];
  } catch {
    // Si la base no contesta, mejor un sitemap con las fijas que ninguno.
    return fijas;
  }
}
