"use server";

import { revalidatePath } from "next/cache";

import type { CambioFila } from "@/lib/supabase/database.types";
import { crearClienteServidor } from "@/lib/supabase/server";
import { PAIS_POR_DEFECTO, esPais, normalizarTelefono } from "@/lib/whatsapp";

export type EstadoPerfil = { error?: string; ok?: boolean };

/**
 * Guarda los datos de contacto del perfil.
 *
 * El teléfono vive acá y no en cada publicación: se carga una vez y se usa
 * en todas. Cambiarlo actualiza el botón de WhatsApp de todo lo publicado,
 * que es justamente lo que uno espera cuando cambia de número.
 */
export async function guardarPerfil(
  _previo: EstadoPerfil,
  datos: FormData,
): Promise<EstadoPerfil> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Tenés que ingresar." };

  const nombre = String(datos.get("nombre") ?? "").trim().slice(0, 60);
  const telefonoCrudo = String(datos.get("telefono") ?? "").trim();
  const salaId = String(datos.get("sala_id") ?? "").trim() || null;
  const zonas = datos.getAll("zonas_entrega").map(String).filter(Boolean);
  const barrio = String(datos.get("barrio") ?? "").trim() || null;

  const cambios: CambioFila<"perfiles"> = {
    nombre,
    sala_id: salaId,
    zonas_entrega: zonas,
    // El barrio sólo tiene sentido si entrega en CABA.
    barrio: zonas.includes("caba") ? barrio : null,
  };

  if (telefonoCrudo) {
    const paisCrudo = datos.get("pais");
    const tel = normalizarTelefono(
      telefonoCrudo,
      esPais(paisCrudo) ? paisCrudo : PAIS_POR_DEFECTO,
    );
    if (!tel.ok) return { error: tel.error };
    cambios.telefono_e164 = tel.e164;
    cambios.telefono_visible = tel.visible;
  }

  const { error } = await supabase.from("perfiles").update(cambios).eq("id", user.id);

  if (error) {
    console.error("Error guardando perfil:", error.message);
    return { error: "No pudimos guardar los cambios." };
  }

  revalidatePath("/cuenta");
  revalidatePath("/publicar");
  return { ok: true };
}
