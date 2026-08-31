"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ZONAS } from "@/lib/geo";
import { diferencias } from "@/lib/correcciones";

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

/**
 * Guarda cambios en una sala.
 *
 * Igual que en torneos: el admin y quien la propuso escriben directo; el
 * resto deja una corrección que se aplica cuando tres personas la avalan.
 *
 * `activa` no entra por acá para nadie que no sea admin — esconder una sala
 * del mapa no es corregir un dato, es moderar.
 */
export async function actualizarSala(
  _previo: EstadoSala,
  datos: FormData,
): Promise<EstadoSala> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar para corregir una sala." };

  const id = String(datos.get("id") ?? "");
  if (!id) return { error: "Falta la sala." };

  const texto = (k: string) => {
    const v = datos.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const nombre = texto("nombre");
  if (!nombre || nombre.length < 3) return { error: "Poné el nombre de la sala." };

  const zona = texto("zona");
  if (!zona || !(zona in ZONAS)) return { error: "Elegí la zona." };

  const lat = texto("lat");
  const lng = texto("lng");

  const propuesto = {
    nombre,
    direccion: texto("direccion"),
    barrio: texto("barrio"),
    zona,
    telefono: texto("telefono"),
    instagram: texto("instagram"),
    nota: texto("nota"),
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
  };

  const admin = crearClienteAdmin();
  const { data: actual } = await admin
    .from("salas")
    .select("nombre, direccion, barrio, zona, telefono, instagram, nota, lat, lng, propuesta_por")
    .eq("id", id)
    .single();

  if (!actual) return { error: "Esa sala ya no existe." };

  const { data: esAdmin } = await supabase.rpc("es_admin");
  const esAutor = actual.propuesta_por === user.id;

  if (esAdmin || esAutor) {
    const { error } = await admin
      .from("salas")
      .update(
        esAdmin
          ? { ...propuesto, activa: datos.get("activa") === "si" }
          : propuesto,
      )
      .eq("id", id);

    if (error) {
      console.error("Error actualizando sala:", error.message);
      return { error: "No pudimos guardar los cambios." };
    }

    revalidatePath("/admin");
    revalidatePath("/mapa");
    redirect(esAdmin ? "/admin?sala=guardada" : "/mapa?sala=guardada");
  }

  const campos = diferencias(actual, propuesto);
  if (Object.keys(campos).length === 0) {
    return { error: "No cambiaste nada todavía." };
  }

  const { error } = await supabase.from("correcciones").insert({
    tabla: "salas",
    fila_id: id,
    campos,
    motivo: texto("motivo"),
    propuesta_por: user.id,
  });

  if (error) {
    console.error("Error proponiendo corrección:", error.message);
    return { error: "No pudimos guardar la corrección. Probá de nuevo." };
  }

  revalidatePath("/correcciones");
  redirect("/correcciones?propuesta=1");
}

/** Borra una sala. Las publicaciones que la usaban quedan sin punto de entrega. */
export async function borrarSala(datos: FormData) {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const admin = crearClienteAdmin();
  await admin.from("salas").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/mapa");
  redirect("/admin?sala=borrada");
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
