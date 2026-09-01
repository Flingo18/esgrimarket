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
  "marca, estado, moneda_base, monto, zonas, barrio, es_oficial, unidades, creado_en, " +
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
  zonas: string[];
  barrio: string | null;
  es_oficial: boolean;
  unidades: number;
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
  // `contains` sobre el arreglo, igual que con las armas: trae todo lo que se
  // entregue en esa zona, aunque además se entregue en otras.
  if (filtros.zona) q = q.contains("zonas", [filtros.zona]);
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

  if (filtros.orden === "barato") q = q.order("monto", { ascending: true });
  else if (filtros.orden === "caro") q = q.order("monto", { ascending: false });
  else q = q.order("creado_en", { ascending: false });

  const { data, error } = await q.limit(60);

  if (error) {
    console.error("Error listando publicaciones:", error.message);
    return [];
  }

  const lista = (data ?? []) as unknown as PublicacionListada[];

  // Si la persona eligió un orden, es porque quiere ese orden: meterle algo
  // arriba a la fuerza sería contestarle otra cosa de la que preguntó.
  if (filtros.orden === "barato" || filtros.orden === "caro") return lista;

  return conDestacadas(lista);
}

/** Cuántas publicaciones propias van arriba de todo. */
const DESTACADAS = 3;

/**
 * Sube unas pocas publicaciones propias al principio.
 *
 * Antes subían todas, y con 37 de 41 marcadas eso dejaba lo de la comunidad
 * siempre al final — que es lo contrario de lo que tiene que hacer un lugar
 * hecho para la comunidad.
 *
 * Las tres cambian cada día: si fueran siempre las mismas, esas tres se
 * llevarían todas las visitas y el resto del catálogo no lo vería nadie. El
 * día como semilla mantiene la lista quieta mientras alguien la mira y la
 * mueve de un día para el otro.
 */
function conDestacadas(lista: PublicacionListada[]): PublicacionListada[] {
  const propias = lista.filter((p) => p.es_oficial);
  if (propias.length === 0) return lista;

  const dia = Math.floor(Date.now() / 86_400_000);
  const desde = dia % propias.length;
  const elegidas = Array.from(
    { length: Math.min(DESTACADAS, propias.length) },
    (_, i) => propias[(desde + i) % propias.length],
  );

  const arriba = new Set(elegidas.map((p) => p.id));
  return [...elegidas, ...lista.filter((p) => !arriba.has(p.id))];
}

/** URL pública de una foto del bucket. */
export function urlFoto(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos/${path}`;
}
