"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FEDERACIONES } from "@/lib/torneos";

export type EstadoCategoria = { error?: string; ok?: string };

function revalidar() {
  revalidatePath("/admin/categorias");
  revalidatePath("/torneos");
}

/** Un número dentro del rango que acepta la base, o null. */
function edad(datos: FormData, campo: string): number | null {
  const v = datos.get(campo);
  if (typeof v !== "string" || !v.trim()) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 120 ? n : null;
}

/**
 * Crea o edita una categoría. Sólo admins.
 *
 * Las categorías no se corrigen por votación como los torneos: son la lista
 * cerrada contra la que se cargan los torneos, y si cambia sola cambia el
 * significado de todo lo que ya está cargado.
 */
export async function guardarCategoria(
  _previo: EstadoCategoria,
  datos: FormData,
): Promise<EstadoCategoria> {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return { error: "No tenés permiso." };

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "Poné el nombre de la categoría." };

  const federacion = String(datos.get("federacion") ?? "");
  if (!(federacion in FEDERACIONES)) return { error: "Elegí la federación." };

  const desde = edad(datos, "edad_desde");
  const hasta = edad(datos, "edad_hasta");
  if (desde !== null && hasta !== null && hasta < desde) {
    return { error: "La edad hasta no puede ser menor que la edad desde." };
  }

  const admin = crearClienteAdmin();
  const id = String(datos.get("id") ?? "");
  const campos = {
    federacion,
    nombre,
    edad_desde: desde,
    edad_hasta: hasta,
    activa: datos.get("activa") !== "no",
  };

  const { error } = id
    ? await admin.from("categorias").update(campos).eq("id", id)
    : await admin.from("categorias").insert(campos);

  if (error) {
    // Nombre repetido dentro de la misma federación.
    if (error.code === "23505") {
      return { error: `${FEDERACIONES[federacion as keyof typeof FEDERACIONES]} ya tiene una categoría con ese nombre.` };
    }
    console.error("Error guardando categoría:", error.message);
    return { error: "No pudimos guardar la categoría." };
  }

  revalidar();
  redirect("/admin/categorias?guardada=1");
}

/**
 * Borra una categoría.
 *
 * Se corta si algún torneo la está usando: borrarla se llevaría puesta la
 * categoría de esos torneos sin dejar rastro. Para sacarla de circulación sin
 * perder lo viejo está el "activa".
 */
export async function borrarCategoria(datos: FormData): Promise<void> {
  const supabase = await crearClienteServidor();
  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const admin = crearClienteAdmin();
  const { count } = await admin
    .from("torneos_categorias")
    .select("torneo_id", { count: "exact", head: true })
    .eq("categoria_id", id);

  if (count) {
    revalidar();
    redirect(`/admin/categorias?en_uso=${count}`);
  }

  await admin.from("categorias").delete().eq("id", id);
  revalidar();
  redirect("/admin/categorias?borrada=1");
}
