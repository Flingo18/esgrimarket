"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { NuevaFila } from "@/lib/supabase/database.types";
import { crearClienteServidor } from "@/lib/supabase/server";
import { normalizarTelefono } from "@/lib/whatsapp";
import {
  ESTADOS,
  MANOS,
  MONEDAS,
  NIVELES_PROTECCION,
  TIPOS_POR_CATEGORIA,
  anioMaximo,
  ANIO_MINIMO,
  metaTipo,
  type Categoria,
} from "@/lib/taxonomy";

export type EstadoPublicacion = { error?: string; campo?: string };

const CATEGORIAS_VALIDAS = Object.keys(TIPOS_POR_CATEGORIA) as Categoria[];

type Campos = Omit<NuevaFila<"publicaciones">, "autor_id">;

/**
 * Valida el formulario y devuelve las columnas listas para guardar.
 *
 * La comparten el alta y la edición: si estuviera duplicada, tarde o temprano
 * una de las dos aceptaría algo que la otra rechaza.
 */
function parsear(datos: FormData): { error: EstadoPublicacion } | { campos: Campos } {
  const texto = (k: string) => {
    const v = datos.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };

  const categoria = texto("categoria") as Categoria | null;
  if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria)) {
    return { error: { error: "Elegí una categoría.", campo: "categoria" } };
  }

  const tipo = texto("tipo");
  const meta = tipo ? metaTipo(categoria, tipo) : null;
  if (!tipo || !meta) {
    return { error: { error: "Elegí qué es lo que estás publicando.", campo: "tipo" } };
  }

  const titulo = texto("titulo");
  if (!titulo || titulo.length < 3 || titulo.length > 90) {
    return { error: { error: "El título va entre 3 y 90 caracteres.", campo: "titulo" } };
  }

  // Sólo se aceptan armas que este tipo admite: así no entra un "lamé de
  // espada", que no existe.
  const armas = datos
    .getAll("armas")
    .map(String)
    .filter((a) => (meta.armas as readonly string[]).includes(a));

  if (armas.length === 0) {
    return { error: { error: "Marcá para qué arma sirve.", campo: "armas" } };
  }

  const estado = texto("estado");
  if (!estado || !(estado in ESTADOS)) {
    return { error: { error: "Elegí en qué estado está.", campo: "estado" } };
  }

  const moneda = texto("moneda_base");
  if (!moneda || !(moneda in MONEDAS)) {
    return { error: { error: "Elegí la moneda.", campo: "moneda_base" } };
  }

  const monto = Number(texto("monto")?.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: { error: "Poné un precio válido.", campo: "monto" } };
  }

  const zona = texto("zona");
  if (!zona) return { error: { error: "Elegí la zona de entrega.", campo: "zona" } };

  // El permiso real lo aplica el trigger de la base; acá sólo se valida que
  // sea un número sensato. Si alguien manda 50 sin tener plan, Postgres lo
  // rechaza con un mensaje que explica por qué.
  const unidades = Math.trunc(Number(texto("unidades") ?? "1"));
  if (!Number.isFinite(unidades) || unidades < 1 || unidades > 999) {
    return { error: { error: "Las unidades van entre 1 y 999.", campo: "unidades" } };
  }

  const anioTexto = texto("anio");
  const anio = anioTexto ? Number(anioTexto) : null;
  if (anio !== null && (anio < ANIO_MINIMO || anio > anioMaximo())) {
    return {
      error: { error: `El año va entre ${ANIO_MINIMO} y ${anioMaximo()}.`, campo: "anio" },
    };
  }

  const mano = texto("mano");
  const nivel = texto("nivel_proteccion");

  // Las coordenadas llegan ya difuminadas desde el navegador: el punto exacto
  // no sale nunca del dispositivo de la persona.
  const lat = texto("lat_aprox");
  const lng = texto("lng_aprox");

  return {
    campos: {
      titulo,
      descripcion: texto("descripcion") ?? "",
      categoria,
      tipo,
      armas_compatibles: armas,
      es_electrica:
        meta.electricidad === "siempre"
          ? true
          : meta.electricidad === "nunca"
            ? false
            : datos.get("es_electrica") === "si",
      empunadura: texto("empunadura"),
      talle: texto("talle"),
      nivel_proteccion: nivel && nivel in NIVELES_PROTECCION ? nivel : null,
      mano: mano && mano in MANOS ? mano : null,
      marca: texto("marca"),
      anio,
      estado,
      moneda_base: moneda,
      monto,
      unidades,
      zona,
      barrio: texto("barrio"),
      lat_aprox: lat ? Number(lat) : null,
      lng_aprox: lng ? Number(lng) : null,
      sala_entrega_id: texto("sala_entrega_id"),
    },
  };
}

/** Guarda el teléfono en el perfil, o avisa si todavía no hay ninguno. */
async function asegurarTelefono(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  userId: string,
  crudo: string | null,
): Promise<EstadoPublicacion | null> {
  if (crudo) {
    const tel = normalizarTelefono(crudo);
    if (!tel.ok) return { error: tel.error, campo: "telefono" };

    await supabase
      .from("perfiles")
      .update({ telefono_e164: tel.e164, telefono_visible: tel.visible })
      .eq("id", userId);
    return null;
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("telefono_e164")
    .eq("id", userId)
    .single();

  if (!perfil?.telefono_e164) {
    return {
      error: "Necesitamos tu WhatsApp para que te puedan contactar.",
      campo: "telefono",
    };
  }
  return null;
}

export async function crearPublicacion(
  _previo: EstadoPublicacion,
  datos: FormData,
): Promise<EstadoPublicacion> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar para publicar." };

  const parsed = parsear(datos);
  if ("error" in parsed) return parsed.error;

  const falta = await asegurarTelefono(
    supabase,
    user.id,
    typeof datos.get("telefono") === "string" ? String(datos.get("telefono")).trim() : null,
  );
  if (falta) return falta;

  const { data: creada, error } = await supabase
    .from("publicaciones")
    .insert({ ...parsed.campos, autor_id: user.id })
    .select("id")
    .single();

  if (error) {
    // P0001 es el límite de publicaciones activas: el mensaje del trigger ya
    // explica qué hacer, así que se muestra tal cual.
    if (error.code === "P0001") return { error: error.message };
    console.error("Error creando publicación:", error);
    return { error: "No pudimos publicar. Probá de nuevo." };
  }

  const rutas = datos.getAll("fotos").map(String).filter(Boolean);
  if (rutas.length > 0) {
    await supabase
      .from("fotos")
      .insert(rutas.map((path, orden) => ({ publicacion_id: creada.id, path, orden })));
  }

  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
  redirect(`/p/${creada.id}`);
}

export async function actualizarPublicacion(
  _previo: EstadoPublicacion,
  datos: FormData,
): Promise<EstadoPublicacion> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que ingresar." };

  const id = String(datos.get("id") ?? "");
  if (!id) return { error: "Falta la publicación a editar." };

  const parsed = parsear(datos);
  if ("error" in parsed) return parsed.error;

  // El .eq('autor_id') es redundante con la política RLS, pero deja explícito
  // en el código que acá nadie edita lo ajeno.
  const { error } = await supabase
    .from("publicaciones")
    .update(parsed.campos)
    .eq("id", id)
    .eq("autor_id", user.id);

  if (error) {
    console.error("Error actualizando publicación:", error);
    return { error: "No pudimos guardar los cambios." };
  }

  // Fotos nuevas agregadas durante la edición.
  const rutas = datos.getAll("fotos").map(String).filter(Boolean);
  if (rutas.length > 0) {
    const { data: existentes } = await supabase
      .from("fotos")
      .select("path")
      .eq("publicacion_id", id);

    const yaEstan = new Set((existentes ?? []).map((f) => f.path));
    const nuevas = rutas.filter((r) => !yaEstan.has(r));

    if (nuevas.length > 0) {
      await supabase.from("fotos").insert(
        nuevas.map((path, i) => ({
          publicacion_id: id,
          path,
          orden: yaEstan.size + i,
        })),
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
  revalidatePath(`/p/${id}`);
  redirect(`/p/${id}`);
}

/** Marcar como vendida libera un lugar del cupo. */
export async function marcarVendida(datos: FormData) {
  const supabase = await crearClienteServidor();
  const id = String(datos.get("id") ?? "");
  await supabase.from("publicaciones").update({ situacion: "vendida" }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
}

/**
 * Vuelve a poner en venta. Puede fallar por el límite de publicaciones
 * activas, y ahí el trigger devuelve el mensaje que explica qué hacer.
 */
export async function reactivar(datos: FormData) {
  const supabase = await crearClienteServidor();
  const id = String(datos.get("id") ?? "");

  const { error } = await supabase
    .from("publicaciones")
    .update({
      situacion: "activa",
      // Reactivar sin renovar la fecha la dejaría vencer de nuevo enseguida.
      vence_en: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
  if (error) redirect(`/mis-publicaciones?error=${encodeURIComponent(error.message)}`);
}

/**
 * Borra la publicación y sus fotos del storage.
 *
 * Las filas de `fotos` se van solas por el ON DELETE CASCADE, pero los
 * archivos del bucket no: sin esto quedarían huérfanos ocupando el giga
 * gratuito para siempre.
 */
export async function borrarPublicacion(datos: FormData) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(datos.get("id") ?? "");

  const { data: fotos } = await supabase
    .from("fotos")
    .select("path")
    .eq("publicacion_id", id);

  if (fotos && fotos.length > 0) {
    await supabase.storage.from("fotos").remove(fotos.map((f) => f.path));
  }

  await supabase.from("publicaciones").delete().eq("id", id).eq("autor_id", user.id);

  revalidatePath("/");
  revalidatePath("/mis-publicaciones");
}
