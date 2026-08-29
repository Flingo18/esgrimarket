"use server";

import { revalidatePath } from "next/cache";

import { crearClienteServidor } from "@/lib/supabase/server";
import { MANOS, TIPOS_POR_CATEGORIA, type Categoria } from "@/lib/taxonomy";

export type EstadoBusqueda = { error?: string; ok?: string };

const CATEGORIAS = Object.keys(TIPOS_POR_CATEGORIA);

/** Guarda una búsqueda para avisar cuando aparezca algo que coincida. */
export async function guardarBusqueda(
  _previo: EstadoBusqueda,
  datos: FormData,
): Promise<EstadoBusqueda> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar." };

  const texto = (k: string) => {
    const v = datos.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const categoria = texto("categoria");
  const tipo = texto("tipo");
  const arma = texto("arma");
  const mano = texto("mano");
  const talle = texto("talle");
  const busqueda = texto("texto");
  const precioTexto = texto("precio_max");
  const precio = precioTexto ? Number(precioTexto.replace(/[^\d.]/g, "")) : null;

  if (precio !== null && (!Number.isFinite(precio) || precio <= 0)) {
    return { error: "El precio máximo tiene que ser un número." };
  }

  // Sin ningún criterio, la alerta saltaría con cada publicación nueva.
  if (!busqueda && !categoria && !tipo && !arma && !talle && precio === null) {
    return { error: "Escribí qué buscás, o elegí al menos un filtro." };
  }

  if (categoria && !CATEGORIAS.includes(categoria)) {
    return { error: "Categoría inválida." };
  }

  const { error } = await supabase.from("busquedas").insert({
    usuario_id: user.id,
    texto: busqueda,
    categoria: categoria as Categoria | null,
    tipo,
    arma,
    mano: mano && mano in MANOS ? mano : null,
    talle,
    precio_max: precio,
    moneda: texto("moneda") === "ARS" ? "ARS" : "USD",
  });

  if (error) {
    console.error("Error guardando búsqueda:", error.message);
    return { error: "No pudimos guardar la búsqueda." };
  }

  revalidatePath("/busquedas");
  return { ok: "Listo. Te avisamos por mail cuando aparezca algo." };
}

export async function borrarBusqueda(datos: FormData) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(datos.get("id") ?? "");
  await supabase.from("busquedas").delete().eq("id", id).eq("usuario_id", user.id);

  revalidatePath("/busquedas");
}
