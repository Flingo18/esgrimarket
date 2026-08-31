/**
 * Correcciones de la comunidad sobre torneos y salas.
 *
 * Quien cargó una entrada la edita directo. Cualquier otro propone un cambio,
 * y cuando tres personas más lo avalan se aplica solo. La idea es que una
 * fecha reprogramada se arregle sin que el admin tenga que estar mirando.
 *
 * Vive acá y no en las acciones: un archivo `"use server"` sólo puede exportar
 * funciones async, y Next descarta el resto sin avisar.
 */

import { FEDERACIONES } from "./torneos";
import { ZONAS } from "./geo";

/**
 * Cuántos avales hacen falta, sin contar a quien la propuso: cuatro personas
 * de acuerdo en total.
 *
 * El mismo número está en la base, en `votos_para_aplicar()`. Si se cambia
 * uno hay que cambiar el otro: acá sólo se usa para explicar cuánto falta,
 * quien decide es la base.
 */
export const VOTOS_PARA_APLICAR = 3;

export type Tabla = "torneos" | "salas";

/** Las columnas que una corrección puede tocar. La base tiene la misma lista. */
export const CAMPOS_CORREGIBLES: Record<Tabla, readonly string[]> = {
  torneos: [
    "nombre", "organizador_tipo", "federacion", "sala_id", "fecha_inicio",
    "fecha_fin", "cierre_inscripcion", "lugar", "contacto_inscripcion", "notas",
  ],
  salas: [
    "nombre", "direccion", "barrio", "zona", "telefono", "instagram",
    "nota", "lat", "lng",
  ],
} as const;

const ETIQUETAS: Record<string, string> = {
  nombre: "Nombre",
  organizador_tipo: "Tipo de organizador",
  federacion: "Federación",
  sala_id: "Club organizador",
  fecha_inicio: "Fecha de inicio",
  fecha_fin: "Fecha de fin",
  cierre_inscripcion: "Cierre de inscripción",
  lugar: "Lugar",
  contacto_inscripcion: "Dónde inscribirse",
  notas: "Notas",
  direccion: "Dirección",
  barrio: "Barrio",
  zona: "Zona",
  telefono: "Teléfono",
  instagram: "Instagram",
  nota: "Nota",
  lat: "Ubicación en el mapa",
  lng: "Ubicación en el mapa",
};

export function etiquetaCampo(campo: string): string {
  return ETIQUETAS[campo] ?? campo;
}

/**
 * Cómo se muestra un valor en el diff.
 *
 * Los identificadores no se muestran crudos: nadie puede juzgar si un cambio
 * está bien mirando un uuid.
 */
export function mostrarValor(
  campo: string,
  valor: unknown,
  nombresDeSala?: Map<string, string>,
): string {
  if (valor === null || valor === undefined || valor === "") return "vacío";

  if (campo === "federacion") {
    return FEDERACIONES[valor as keyof typeof FEDERACIONES] ?? String(valor);
  }
  if (campo === "sala_id") {
    return nombresDeSala?.get(String(valor)) ?? "otro club";
  }
  if (campo === "zona") {
    return ZONAS[valor as keyof typeof ZONAS]?.label ?? String(valor);
  }
  if (campo === "organizador_tipo") {
    return valor === "club" ? "Un club" : "Una federación";
  }
  if (campo === "lat" || campo === "lng") {
    return Number(valor).toFixed(5);
  }
  return String(valor);
}

/**
 * Qué cambia entre lo que hay y lo que se propone.
 *
 * Sólo viajan las claves distintas: una corrección de la fecha no tiene que
 * volver a escribir el resto de la ficha, porque si alguien la tocó mientras
 * tanto ese cambio se perdería sin que nadie lo notara.
 */
export function diferencias(
  actual: Record<string, unknown>,
  propuesto: Record<string, unknown>,
): Record<string, unknown> {
  const cambios: Record<string, unknown> = {};
  for (const [campo, nuevo] of Object.entries(propuesto)) {
    const viejo = actual[campo] ?? null;
    const limpio = nuevo ?? null;
    if (String(viejo ?? "") !== String(limpio ?? "")) cambios[campo] = limpio;
  }
  return cambios;
}

/**
 * Una corrección ya lista para dibujar.
 *
 * El "antes → después" se arma en el servidor y viaja como texto: el cliente
 * no tiene por qué saber que una federación es un id ni que un club es un
 * uuid, y así la ficha del torneo no necesita cargar tablas de nombres sólo
 * para mostrar un cambio.
 */
export type CambioVisible = {
  campo: string;
  etiqueta: string;
  antes: string;
  despues: string;
};

export type CorreccionVisible = {
  id: string;
  motivo: string | null;
  avales: number;
  faltan: number;
  esMia: boolean;
  yaAvale: boolean;
  puedeAvalar: boolean;
};

export type CorreccionConCambios = CorreccionVisible & {
  cambios: CambioVisible[];
};

/** Arma el "antes → después" de una corrección contra la fila que hay hoy. */
export function cambiosVisibles(
  campos: Record<string, unknown>,
  actual: Record<string, unknown> | undefined,
  nombresDeSala?: Map<string, string>,
): CambioVisible[] {
  return Object.entries(campos).map(([campo, nuevo]) => ({
    campo,
    etiqueta: etiquetaCampo(campo),
    antes: mostrarValor(campo, actual?.[campo], nombresDeSala),
    despues: mostrarValor(campo, nuevo, nombresDeSala),
  }));
}
