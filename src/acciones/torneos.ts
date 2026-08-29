"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FEDERACIONES } from "@/lib/torneos";

export type EstadoTorneo = { error?: string; ok?: string };

/** Propone un torneo. Queda pendiente hasta que un admin lo apruebe. */
export async function proponerTorneo(
  _previo: EstadoTorneo,
  datos: FormData,
): Promise<EstadoTorneo> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar para proponer un torneo." };

  const texto = (k: string) => {
    const v = datos.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const nombre = texto("nombre");
  if (!nombre || nombre.length < 3) return { error: "Poné el nombre del torneo." };

  // El organizador es una federación de la lista, o un club del mapa.
  const organizador = texto("organizador_tipo") === "club" ? "club" : "federacion";
  const federacion = organizador === "federacion" ? texto("federacion") : null;
  const salaId = organizador === "club" ? texto("sala_id") : null;

  if (organizador === "federacion" && (!federacion || !(federacion in FEDERACIONES))) {
    return { error: "Elegí la federación que lo organiza." };
  }
  if (organizador === "club" && !salaId) {
    return { error: "Elegí el club que lo organiza." };
  }

  const inicio = texto("fecha_inicio");
  const fin = texto("fecha_fin");
  if (fin && inicio && fin < inicio) {
    return { error: "La fecha de fin no puede ser anterior a la de inicio." };
  }

  const { error } = await supabase.from("torneos").insert({
    nombre,
    organizador_tipo: organizador,
    federacion,
    sala_id: salaId,
    fecha_inicio: inicio,
    fecha_fin: fin,
    cierre_inscripcion: texto("cierre_inscripcion"),
    lugar: texto("lugar"),
    contacto_inscripcion: texto("contacto_inscripcion"),
    notas: texto("notas"),
    situacion: "pendiente",
    propuesto_por: user.id,
  });

  if (error) {
    console.error("Error proponiendo torneo:", error.message);
    return { error: "No pudimos guardar la propuesta. Probá de nuevo." };
  }

  revalidatePath("/torneos");
  revalidatePath("/admin");
  return { ok: "Listo, quedó enviado. Lo revisamos y lo publicamos." };
}

/** Aprueba o rechaza un torneo propuesto. Sólo admins. */
export async function moderarTorneo(
  _previo: EstadoTorneo,
  datos: FormData,
): Promise<EstadoTorneo> {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return { error: "No tenés permiso." };

  const id = String(datos.get("id") ?? "");
  const decision = String(datos.get("decision") ?? "");
  if (!id || !["aprobado", "rechazado"].includes(decision)) {
    return { error: "Datos incompletos." };
  }

  const admin = crearClienteAdmin();
  const { error } = await admin
    .from("torneos")
    .update({ situacion: decision })
    .eq("id", id);

  if (error) {
    console.error("Error moderando torneo:", error.message);
    return { error: "No pudimos guardar la decisión." };
  }

  revalidatePath("/admin");
  revalidatePath("/torneos");
  redirect(`/admin?torneo=${decision}`);
}
