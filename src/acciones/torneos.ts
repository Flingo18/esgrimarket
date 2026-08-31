"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FEDERACIONES } from "@/lib/torneos";
import { diferencias } from "@/lib/correcciones";

export type EstadoTorneo = { error?: string; ok?: string };


/**
 * Deja las categorías del torneo exactamente como vinieron del formulario.
 *
 * Se borra y se vuelve a insertar en vez de calcular el diferencial: son tres
 * o cuatro filas por torneo y el orden no significa nada, así que la versión
 * simple es también la que no se puede equivocar.
 *
 * Los ids se validan contra la tabla: el formulario manda lo que quiera.
 */
async function guardarCategorias(
  admin: ReturnType<typeof crearClienteAdmin>,
  torneoId: string,
  pedidas: string[],
): Promise<void> {
  const { data: validas } = await admin
    .from("categorias")
    .select("id")
    .in("id", pedidas.length ? pedidas : ["00000000-0000-0000-0000-000000000000"]);

  await admin.from("torneos_categorias").delete().eq("torneo_id", torneoId);

  const filas = (validas ?? []).map((c) => ({
    torneo_id: torneoId,
    categoria_id: c.id,
  }));
  if (filas.length) await admin.from("torneos_categorias").insert(filas);
}

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

  const { data: creado, error } = await supabase.from("torneos").insert({
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
  }).select("id").single();

  if (error) {
    console.error("Error proponiendo torneo:", error.message);
    return { error: "No pudimos guardar la propuesta. Probá de nuevo." };
  }

  if (creado) {
    await guardarCategorias(
      crearClienteAdmin(),
      creado.id,
      datos.getAll("categorias").map(String),
    );
  }

  revalidatePath("/torneos");
  revalidatePath("/admin");
  return { ok: "Listo, quedó enviado. Lo revisamos y lo publicamos." };
}

/**
 * Edita un torneo. Sólo admins.
 *
 * Hace falta sobre todo por las fechas: se reprograman seguido y sin esto
 * había que corregirlas tocando la base a mano.
 */
/**
 * Guarda cambios en un torneo.
 *
 * Dos caminos, según quién sea el que aprieta el botón:
 *
 *   - El admin y quien cargó el torneo escriben directo.
 *   - Cualquier otro deja una corrección propuesta, que se aplica sola cuando
 *     tres personas más la avalan.
 *
 * El formulario es el mismo en los dos casos. Quien corrige no tiene por qué
 * saber en cuál de los dos está: llena la ficha y manda.
 */
export async function actualizarTorneo(
  _previo: EstadoTorneo,
  datos: FormData,
): Promise<EstadoTorneo> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar para corregir un torneo." };

  const id = String(datos.get("id") ?? "");
  if (!id) return { error: "Falta el torneo." };

  const texto = (k: string) => {
    const v = datos.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const nombre = texto("nombre");
  if (!nombre || nombre.length < 3) return { error: "Poné el nombre del torneo." };

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

  const propuesto = {
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
  };

  const admin = crearClienteAdmin();
  const { data: actual } = await admin
    .from("torneos")
    .select("nombre, organizador_tipo, federacion, sala_id, fecha_inicio, fecha_fin, cierre_inscripcion, lugar, contacto_inscripcion, notas, propuesto_por")
    .eq("id", id)
    .single();

  if (!actual) return { error: "Ese torneo ya no existe." };

  const { data: esAdmin } = await supabase.rpc("es_admin");
  const esAutor = actual.propuesto_por === user.id;

  if (esAdmin || esAutor) {
    const { error } = await admin.from("torneos").update(propuesto).eq("id", id);
    if (error) {
      console.error("Error actualizando torneo:", error.message);
      return { error: "No pudimos guardar los cambios." };
    }

    // Sólo quien edita directo toca las categorías: en una corrección viajan
    // campos de la fila, y esto es una tabla aparte. El formulario ni siquiera
    // las muestra cuando se está sugiriendo.
    await guardarCategorias(
      admin,
      id,
      datos.getAll("categorias").map(String),
    );

    revalidatePath("/torneos");
    revalidatePath("/admin");
    redirect(esAdmin ? "/admin?torneo=guardado" : "/torneos?torneo=guardado");
  }

  const campos = diferencias(actual, propuesto);
  if (Object.keys(campos).length === 0) {
    return { error: "No cambiaste nada todavía." };
  }

  // Se inserta con el cliente del usuario a propósito: así las reglas de la
  // base son las que verifican quién propone, y no una comprobación nuestra
  // que mañana alguien puede olvidarse de escribir.
  const { error } = await supabase.from("correcciones").insert({
    tabla: "torneos",
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

/** Borra un torneo. Definitivo. */
export async function borrarTorneo(datos: FormData) {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const admin = crearClienteAdmin();
  await admin.from("torneos").delete().eq("id", id);

  revalidatePath("/torneos");
  revalidatePath("/admin");
  redirect("/admin?torneo=borrado");
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
