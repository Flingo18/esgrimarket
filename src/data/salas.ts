/**
 * Salas de esgrima de CABA y GBA.
 *
 * A diferencia de las ubicaciones de productos, acá la coordenada es exacta
 * y pública: son instituciones, no domicilios particulares.
 *
 * Las coordenadas de CABA salen del normalizador oficial del Gobierno de la
 * Ciudad (servicios.usig.buenosaires.gob.ar), no de un geocodificador
 * genérico. La diferencia no es menor: para Venezuela 330, Nominatim devolvía
 * un punto a casi 2 km del real, porque cae al centro de la calle cuando no
 * encuentra la altura exacta.
 *
 * Una sala sin coordenada aparece en la lista y se puede elegir como punto de
 * entrega, pero no se dibuja en el mapa. Mejor eso que una chinche inventada.
 *
 * Cargar con: node supabase/seed-salas.mjs
 */

export type Sala = {
  nombre: string;
  direccion: string;
  barrio: string;
  /** Nulas cuando todavía no tenemos la dirección exacta. */
  lat: number | null;
  lng: number | null;
  telefono?: string;
  sitioWeb?: string;
  instagram?: string;
};

export const SALAS: Sala[] = [
  {
    nombre: "Fundación Argentina de Esgrima",
    direccion: "Venezuela 330",
    barrio: "Montserrat",
    lat: -34.613608,
    lng: -58.370965,
    telefono: "011 5476-3438",
  },
  {
    nombre: "Centro Asturiano — Esgrima",
    direccion: "Solís 475",
    barrio: "Montserrat",
    lat: -34.614553,
    lng: -58.39043,
  },
  {
    nombre: "Academia de Esgrima",
    direccion: "Tinogasta 4475",
    barrio: "Villa Devoto",
    lat: -34.608824,
    lng: -58.509696,
    telefono: "011 6800-6295",
  },
  {
    nombre: "Escuela de Esgrima Scaramouche",
    direccion: "Av. Corrientes 3860",
    barrio: "Almagro",
    lat: -34.60347,
    lng: -58.418835,
    telefono: "011 15-3885-1382",
  },
  {
    nombre: "Club Universitario de Buenos Aires (CUBA) — Sede Palermo",
    direccion: "Av. Belisario Roldán 4950",
    barrio: "Palermo",
    lat: -34.565318,
    lng: -58.416986,
    telefono: "011 4774-5476",
  },
  {
    // Coordenada confirmada por dos fuentes independientes (OpenStreetMap y
    // Georef, la API del Estado): coinciden dentro de 30 m, y el código
    // postal que devuelven es el mismo del cartel (B1638BIJ).
    nombre: "Esgrima Centro Naval Olivos",
    direccion: "Juan Díaz de Solís 1970",
    barrio: "Vicente López",
    lat: -34.513291,
    lng: -58.47495,
  },
  // PENDIENTE: falta la dirección de calle. Se lista sin coordenada.
  {
    nombre: "Sala de Esgrima Pampín-Coltorti",
    direccion: "",
    barrio: "Don Torcuato",
    lat: null,
    lng: null,
    telefono: "011 2456-0478",
  },
];
