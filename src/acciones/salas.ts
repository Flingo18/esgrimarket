"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ZONAS } from "@/lib/geo";

export type EstadoSala = { error?: string; ok?: string };

/**
 * Propone una sala nueva. Queda pendiente hasta que un admin la apruebe.
 *
 * La coordenada acá NO se difumina: una sala es una institución con dirección
 * pública, al revés de la ubicación de un producto, que es el domicilio de
 * alguien.
 */
export async function proponerSala(
  _previo: EstadoSala,
  datos: FormData,
): Promise<EstadoSala> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar para proponer una sala." };

  const texto = (k: string) => {
    const v = datos.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const nombre = texto("nombre");
  if (!nombre || nombre.length < 3) {
    return { error: "Poné el nombre de la sala." };
  }

  const zona = texto("zona");
  if (!zona || !(zona in ZONAS)) return { error: "Elegí la zona." };

  const lat = texto("lat");
  const lng = texto("lng");

  const { error } = await supabase.from("salas").insert({
    nombre,
    direccion: texto("direccion"),
    barrio: texto("barrio"),
    zona,
    telefono: texto("telefono"),
    instagram: texto("instagram"),
    nota: texto("nota"),
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    situacion: "pendiente",
    propuesta_por: user.id,
    activa: true,
  });

  if (error) {
    console.error("Error proponiendo sala:", error.message);
    return { error: "No pudimos guardar la propuesta. Probá de nuevo." };
  }

  revalidatePath("/mapa");
  revalidatePath("/admin");
  return { ok: "Listo, la propuesta quedó enviada. La revisamos y la publicamos." };
}

/** Aprueba o rechaza una sala propuesta. Sólo admins. */
export async function moderarSala(
  _previo: EstadoSala,
  datos: FormData,
): Promise<EstadoSala> {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return { error: "No tenés permiso." };

  const id = String(datos.get("id") ?? "");
  const decision = String(datos.get("decision") ?? "");
  if (!id || !["aprobada", "rechazada"].includes(decision)) {
    return { error: "Datos incompletos." };
  }

  const admin = crearClienteAdmin();
  const { error } = await admin
    .from("salas")
    .update({ situacion: decision })
    .eq("id", id);

  if (error) {
    console.error("Error moderando sala:", error.message);
    return { error: "No pudimos guardar la decisión." };
  }

  revalidatePath("/admin");
  revalidatePath("/mapa");

  // Se redirige en lugar de devolver el mensaje: la fila que lo mostraría
  // desaparece de la lista en el mismo momento, así que nadie llegaba a leerlo.
  redirect(`/admin?sala=${decision}`);
}
