"use server";

import { revalidatePath } from "next/cache";

import type { CambioFila } from "@/lib/supabase/database.types";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { normalizarTelefono } from "@/lib/whatsapp";
import { ROLES, type Rol } from "@/lib/roles";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Cambia el rol de una cuenta. Sólo un admin puede hacerlo.
 *
 * La comprobación se hace acá y no sólo en la interfaz: una acción de
 * servidor es una URL, y cualquiera puede invocarla a mano.
 */
export async function cambiarRol(
  _previo: { error?: string; ok?: string },
  datos: FormData,
): Promise<{ error?: string; ok?: string }> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar." };

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) return { error: "No tenés permiso." };

  const objetivo = String(datos.get("usuario") ?? "");
  const rol = String(datos.get("rol") ?? "") as Rol;

  if (!objetivo || !(rol in ROLES)) return { error: "Datos incompletos." };

  // Sin esto, un admin puede degradarse solo y quedarse afuera del panel sin
  // forma de volver a entrar salvo por SQL.
  if (objetivo === user.id) {
    return { error: "No podés cambiar tu propio rol." };
  }

  const admin = crearClienteAdmin();
  const { error } = await admin
    .from("perfiles")
    .update({
      rol,
      // Al dejar de ser pro se limpia el vencimiento, para que no quede una
      // fecha vieja que confunda si más adelante vuelve a serlo.
      rol_hasta: rol === "pro" ? null : null,
    })
    .eq("id", objetivo);

  if (error) {
    console.error("Error cambiando rol:", error.message);
    return { error: "No pudimos guardar el cambio." };
  }

  revalidatePath("/admin");
  return { ok: `Cuenta actualizada a ${ROLES[rol]}.` };
}


/** Comprueba que quien llama sea admin y devuelve su id. */
async function exigirAdmin(): Promise<string | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: esAdmin } = await supabase.rpc("es_admin");
  return esAdmin ? user.id : null;
}

/**
 * Suspende o reactiva una cuenta.
 *
 * Suspender esconde a la persona y a todas sus publicaciones, pero no borra
 * nada: al reactivar vuelve todo como estaba. Es lo que se quiere para
 * moderar, al revés del borrado, que es definitivo.
 */
export async function cambiarSuspension(
  _previo: { error?: string; ok?: string },
  datos: FormData,
): Promise<{ error?: string; ok?: string }> {
  const yo = await exigirAdmin();
  if (!yo) return { error: "No tenés permiso." };

  const objetivo = String(datos.get("usuario") ?? "");
  const suspender = datos.get("suspender") === "si";
  const motivo = String(datos.get("motivo") ?? "").trim() || null;

  if (!objetivo) return { error: "Falta la cuenta." };
  if (objetivo === yo) return { error: "No podés suspenderte a vos mismo." };

  const admin = crearClienteAdmin();
  const { error } = await admin
    .from("perfiles")
    .update({
      suspendido: suspender,
      motivo_suspension: suspender ? motivo : null,
    })
    .eq("id", objetivo);

  if (error) {
    console.error("Error cambiando suspensión:", error.message);
    return { error: "No pudimos guardar el cambio." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/usuarios/${objetivo}`);
  revalidatePath("/");
  return {
    ok: suspender
      ? "Cuenta suspendida. Sus publicaciones dejaron de verse."
      : "Cuenta reactivada. Sus publicaciones volvieron al listado.",
  };
}

/** Corrige el nombre o el teléfono de una cuenta. */
export async function editarPerfilAjeno(
  _previo: { error?: string; ok?: string },
  datos: FormData,
): Promise<{ error?: string; ok?: string }> {
  const yo = await exigirAdmin();
  if (!yo) return { error: "No tenés permiso." };

  const objetivo = String(datos.get("usuario") ?? "");
  if (!objetivo) return { error: "Falta la cuenta." };

  const nombre = String(datos.get("nombre") ?? "").trim().slice(0, 60);
  const telefonoCrudo = String(datos.get("telefono") ?? "").trim();

  const cambios: CambioFila<"perfiles"> = { nombre };

  if (telefonoCrudo) {
    const tel = normalizarTelefono(telefonoCrudo);
    if (!tel.ok) return { error: tel.error };
    cambios.telefono_e164 = tel.e164;
    cambios.telefono_visible = tel.visible;
  }

  const admin = crearClienteAdmin();
  const { error } = await admin.from("perfiles").update(cambios).eq("id", objetivo);

  if (error) {
    console.error("Error editando perfil:", error.message);
    return { error: "No pudimos guardar los cambios." };
  }

  revalidatePath(`/admin/usuarios/${objetivo}`);
  return { ok: "Datos actualizados." };
}

/**
 * Borra una cuenta entera. Definitivo: se lleva publicaciones y fotos.
 *
 * Existe para casos que la suspensión no cubre, como un pedido de borrado de
 * datos. Para moderar conviene suspender.
 */
export async function borrarCuentaAjena(datos: FormData) {
  const yo = await exigirAdmin();
  if (!yo) return;

  const objetivo = String(datos.get("usuario") ?? "");
  if (!objetivo || objetivo === yo) return;

  const admin = crearClienteAdmin();

  const { data: fotos } = await admin
    .from("fotos")
    .select("path, publicaciones!inner(autor_id)")
    .eq("publicaciones.autor_id", objetivo);

  const rutas = (fotos ?? []).map((f) => f.path);
  if (rutas.length > 0) await admin.storage.from("fotos").remove(rutas);

  await admin.auth.admin.deleteUser(objetivo);

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin?cuenta=borrada");
}


/**
 * Baja una publicación ajena, dejándola pausada en lugar de borrarla.
 *
 * Pausada sale del listado pero la persona la sigue viendo en sus
 * publicaciones: se entera de que pasó algo, y el dato no se pierde.
 */
export async function bajarPublicacion(datos: FormData) {
  const yo = await exigirAdmin();
  if (!yo) return;

  const id = String(datos.get("id") ?? "");
  if (!id) return;

  const admin = crearClienteAdmin();
  await admin.from("publicaciones").update({ situacion: "pausada" }).eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin");
}
