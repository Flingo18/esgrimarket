"use server";

import { revalidatePath } from "next/cache";

import { crearClienteServidor } from "@/lib/supabase/server";
import { TODAS_LAS_ARMAS } from "@/lib/taxonomy";

export type EstadoAvisoTorneo = { error?: string; ok?: string };

/**
 * Guarda a qué torneos quiere que le avisen.
 *
 * Es una fila por persona, no una por preferencia: dos filas del mismo
 * usuario le mandarían dos mails por el mismo torneo. Por eso va con upsert
 * sobre `usuario_id`, que en la base es único.
 *
 * Sin armas elegidas quiere decir "todas", no "ninguna". Alguien que quiere
 * enterarse de todo no tiene que tildar las tres.
 */
export async function guardarAvisoTorneo(
  _previo: EstadoAvisoTorneo,
  datos: FormData,
): Promise<EstadoAvisoTorneo> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar." };

  const pedidas = datos.getAll("armas").map(String);
  const armas = TODAS_LAS_ARMAS.filter((a) => pedidas.includes(a));
  const categorias = datos.getAll("categorias").map(String).filter(Boolean);

  const { error } = await supabase
    .from("avisos_torneos")
    .upsert(
      { usuario_id: user.id, armas, categorias, activo: true },
      { onConflict: "usuario_id" },
    );

  if (error) {
    console.error("Error guardando aviso de torneos:", error.message);
    return { error: "No pudimos guardar el aviso." };
  }

  revalidatePath("/busquedas");
  return {
    ok:
      armas.length === 0 && categorias.length === 0
        ? "Listo, te avisamos de todos los torneos que se carguen."
        : "Listo, te avisamos cuando se cargue un torneo así.",
  };
}

/** Deja de recibir avisos de torneos, sin perder la preferencia guardada. */
export async function borrarAvisoTorneo(): Promise<void> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("avisos_torneos").delete().eq("usuario_id", user.id);
  revalidatePath("/busquedas");
}
