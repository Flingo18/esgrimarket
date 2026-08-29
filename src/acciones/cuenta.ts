"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Borra la cuenta de quien la pide, con todo lo que cuelga de ella.
 *
 * El borrado del usuario arrastra en cascada el perfil, las publicaciones y
 * las filas de fotos. Los archivos del bucket NO se van solos: hay que
 * eliminarlos a mano o quedan huérfanos ocupando lugar para siempre.
 */
export async function borrarCuenta(
  _previo: { error?: string },
  datos: FormData,
): Promise<{ error?: string }> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  // Confirmación escrita: borrar la cuenta no se deshace, así que no puede
  // pasar por un click distraído.
  const confirmacion = String(datos.get("confirmacion") ?? "").trim().toUpperCase();
  if (confirmacion !== "BORRAR") {
    return { error: 'Escribí BORRAR para confirmar.' };
  }

  const admin = crearClienteAdmin();

  const { data: fotos } = await admin
    .from("fotos")
    .select("path, publicaciones!inner(autor_id)")
    .eq("publicaciones.autor_id", user.id);

  const rutas = (fotos ?? []).map((f) => f.path);
  if (rutas.length > 0) {
    await admin.storage.from("fotos").remove(rutas);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Error borrando cuenta:", error.message);
    return { error: "No pudimos borrar la cuenta. Probá de nuevo." };
  }

  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/?cuenta=borrada");
}
