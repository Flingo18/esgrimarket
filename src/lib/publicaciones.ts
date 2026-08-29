import { crearClienteServidor } from "@/lib/supabase/server";

import type { Arma, Categoria, Mano } from "./taxonomy";

export type Filtros = {
  texto?: string;
  categoria?: Categoria;
  arma?: Arma;
  mano?: Mano;
  zona?: string;
  electrica?: boolean;
  orden?: "reciente" | "barato" | "caro";
};

/** Lo que necesita una tarjeta del listado. Se piden sólo esas columnas: no
 *  tiene sentido traer la descripción entera de 40 publicaciones. */
const COLUMNAS_TARJETA =
  "id, titulo, categoria, tipo, armas_compatibles, es_electrica, talle, mano, " +
  "marca, estado, moneda_base, monto, zona, barrio, es_oficial, creado_en, " +
  "fotos(path, orden)";

export type PublicacionListada = {
  id: string;
  titulo: string;
  categoria: string;
  tipo: string;
  armas_compatibles: string[];
  es_electrica: boolean | null;
  talle: string | null;
  mano: string | null;
  marca: string | null;
  estado: string;
  moneda_base: string;
  monto: number;
  zona: string;
  barrio: string | null;
  es_oficial: boolean;
  creado_en: string;
  fotos: { path: string; orden: number }[];
};

export async function listarPublicaciones(
  filtros: Filtros,
): Promise<PublicacionListada[]> {
  const supabase = await crearClienteServidor();

  // La RLS ya limita a lo activo y no vencido: no hace falta repetirlo acá,
  // y si se repitiera habría dos lugares que mantener sincronizados.
  let q = supabase.from("publicaciones").select(COLUMNAS_TARJETA);

  if (filtros.categoria) q = q.eq("categoria", filtros.categoria);
  if (filtros.mano) q = q.in("mano", [filtros.mano, "indistinto"]);
  if (filtros.zona) q = q.eq("zona", filtros.zona);
  if (filtros.electrica !== undefined) q = q.eq("es_electrica", filtros.electrica);

  // `contains` sobre el arreglo: trae todo lo compatible con esa arma, así
  // una chaqueta blanca aparece filtrando por florete, espada o sable.
  if (filtros.arma) q = q.contains("armas_compatibles", [filtros.arma]);

  if (filtros.texto) {
    const consulta = filtros.texto
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p.replace(/[^\p{L}\p{N}]/gu, ""))
      .filter(Boolean)
      .join(" & ");
    if (consulta) q = q.textSearch("busqueda", consulta, { config: "spanish" });
  }

  // Las de la tienda propia primero: es el único lugar donde el orden se
  // inclina a propósito.
  q = q.order("es_oficial", { ascending: false });

  if (filtros.orden === "barato") q = q.order("monto", { ascending: true });
  else if (filtros.orden === "caro") q = q.order("monto", { ascending: false });
  else q = q.order("creado_en", { ascending: false });

  const { data, error } = await q.limit(60);

  if (error) {
    console.error("Error listando publicaciones:", error.message);
    return [];
  }

  return (data ?? []) as unknown as PublicacionListada[];
}

/** URL pública de una foto del bucket. */
export function urlFoto(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos/${path}`;
}
