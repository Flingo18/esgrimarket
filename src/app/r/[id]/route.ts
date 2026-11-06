import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { contactoPermitido } from "@/lib/contacto-externo";
import { crearClienteServidor } from "@/lib/supabase/server";
import { linkWhatsApp } from "@/lib/whatsapp";

/**
 * Redirige a WhatsApp sin que el número aparezca nunca en el HTML.
 *
 * Tres cosas de una: el teléfono no queda expuesto a los scrapers de spam,
 * la función de la base valida que la publicación siga activa, y se cuenta
 * el contacto — que es la única métrica que dice si esto le sirve a alguien.
 *
 * Una publicación puede traer `url_contacto`: lo que se encarga en vez de
 * venderse de una, y va a un formulario. El contacto se cuenta igual, porque
 * se sigue llamando a la función de la base antes de decidir el destino.
 *
 * Esa URL la carga sólo un admin —la policy de la tabla lo exige— porque
 * mandar a cualquier lado desde nuestro dominio es exactamente el trampolín
 * que buscan las estafas de phishing.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const [{ data: telefono }, { data: publicacion }] = await Promise.all([
    supabase.rpc("contacto_whatsapp", { pub_id: id }),
    supabase.from("publicaciones").select("titulo, url_contacto").eq("id", id).single(),
  ]);

  // Se vuelve a validar acá, contra la lista de dominios, y no se confía en
  // que la columna sólo la haya podido escribir un admin: si alguna vez se
  // escribe por fuera de la aplicación, este redirect es el que la ejecutaría.
  const porFormulario = contactoPermitido(publicacion?.url_contacto);
  if (porFormulario) {
    redirect(porFormulario);
  }

  if (!telefono || !publicacion) {
    redirect(`/p/${id}?error=sin_contacto`);
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/p/${id}`;
  redirect(linkWhatsApp(telefono, publicacion.titulo, url));
}
