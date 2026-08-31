"use server";

import { revalidatePath } from "next/cache";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoCorreccion = { error?: string; ok?: string };

function revalidarTodo() {
  revalidatePath("/correcciones");
  revalidatePath("/torneos");
  revalidatePath("/mapa");
  revalidatePath("/admin");
}

/**
 * Avala una corrección.
 *
 * No decide nada acá: inserta el voto y la base cuenta. Si con este llega a
 * los avales necesarios, un trigger aplica el cambio en la misma transacción.
 * Así dos personas votando al mismo tiempo no pueden aplicarla dos veces.
 *
 * El insert va con el cliente del usuario para que las reglas de la tabla
 * sean las que impidan votarse a uno mismo o votar dos veces.
 */
export async function avalarCorreccion(datos: FormData): Promise<void> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase
    .from("correcciones_votos")
    .insert({ correccion_id: id, usuario_id: user.id });

  // Votar dos veces no es un problema que haya que contarle a nadie: la
  // pantalla ya va a mostrar el voto que existe.
  if (error && error.code !== "23505") {
    console.error("Error avalando corrección:", error.message);
  }

  revalidarTodo();
}

/** Retira el aval propio, mientras la corrección siga pendiente. */
export async function retirarAval(datos: FormData): Promise<void> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  await supabase
    .from("correcciones_votos")
    .delete()
    .eq("correccion_id", id)
    .eq("usuario_id", user.id);

  revalidarTodo();
}

/** Descarta una corrección sin aplicarla. Sólo admins. */
export async function rechazarCorreccion(datos: FormData): Promise<void> {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const admin = crearClienteAdmin();
  await admin
    .from("correcciones")
    .update({
      situacion: "rechazada",
      resuelto_en: new Date().toISOString(),
      nota_sistema: "Descartada por el admin.",
    })
    .eq("id", id)
    .eq("situacion", "pendiente");

  revalidarTodo();
}

/**
 * Retira la propia corrección propuesta.
 *
 * Se marca rechazada en lugar de borrarse: los avales que ya juntó son parte
 * de lo que pasó, y borrar la fila los borraría con ella.
 */
export async function retirarCorreccion(datos: FormData): Promise<void> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const admin = crearClienteAdmin();
  await admin
    .from("correcciones")
    .update({
      situacion: "rechazada",
      resuelto_en: new Date().toISOString(),
      nota_sistema: "Retirada por quien la propuso.",
    })
    .eq("id", id)
    .eq("propuesta_por", user.id)
    .eq("situacion", "pendiente");

  revalidarTodo();
}
