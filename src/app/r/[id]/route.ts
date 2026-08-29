import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { crearClienteServidor } from "@/lib/supabase/server";
import { linkWhatsApp } from "@/lib/whatsapp";

/**
 * Redirige a WhatsApp sin que el número aparezca nunca en el HTML.
 *
 * Tres cosas de una: el teléfono no queda expuesto a los scrapers de spam,
 * la función de la base valida que la publicación siga activa, y se cuenta
 * el contacto — que es la única métrica que dice si esto le sirve a alguien.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const [{ data: telefono }, { data: publicacion }] = await Promise.all([
    supabase.rpc("contacto_whatsapp", { pub_id: id }),
    supabase.from("publicaciones").select("titulo").eq("id", id).single(),
  ]);

  if (!telefono || !publicacion) {
    redirect(`/p/${id}?error=sin_contacto`);
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/p/${id}`;
  redirect(linkWhatsApp(telefono, publicacion.titulo, url));
}
