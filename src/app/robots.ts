import type { MetadataRoute } from "next";

const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? "https://esgrimarket.com.ar";

/**
 * Sin esto los buscadores tienen que adivinar qué mirar, y no encuentran el
 * sitemap. Las pantallas privadas se bloquean explícitamente: no aportan nada
 * en una búsqueda y sólo gastan el presupuesto de rastreo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cuenta", "/admin", "/publicar", "/busquedas", "/mis-publicaciones", "/auth/", "/r/", "/api/"],
    },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
