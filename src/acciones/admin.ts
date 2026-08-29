"use server";

import { revalidatePath } from "next/cache";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { ROLES, type Rol } from "@/lib/roles";
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
