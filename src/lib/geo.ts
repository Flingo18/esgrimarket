/**
 * Ubicaciones aproximadas.
 *
 * Regla del proyecto: la coordenada exacta que carga el vendedor NUNCA se
 * guarda. Al crear la publicación se le aplica un desplazamiento aleatorio
 * y sólo se persiste el punto corrido. Así, ni una filtración de la base
 * revela dónde vive alguien que publicó un arma cara.
 *
 * El desplazamiento se calcula UNA sola vez, al escribir. Hacerlo en cada
 * lectura sería peor: promediando varias consultas se recupera el original.
 */

/** Radio máximo del corrimiento aplicado al guardar. */
export const RADIO_OFFSET_M = 400;

/** Radio del círculo que se dibuja en el mapa. */
export const RADIO_DISPLAY_M = 500;

const METROS_POR_GRADO_LAT = 111_320;

export type Punto = { lat: number; lng: number };

/**
 * Corre un punto a una posición aleatoria dentro de un disco de radio
 * `RADIO_OFFSET_M`. El `sqrt` reparte los resultados de forma pareja sobre el
 * área; sin él se amontonarían cerca del centro y el punto real sería
 * estadísticamente adivinable.
 */
export function difuminarUbicacion(punto: Punto, radioM = RADIO_OFFSET_M): Punto {
  const angulo = Math.random() * 2 * Math.PI;
  const distancia = radioM * Math.sqrt(Math.random());

  const dNorte = distancia * Math.cos(angulo);
  const dEste = distancia * Math.sin(angulo);

  const dLat = dNorte / METROS_POR_GRADO_LAT;
  const dLng = dEste / (METROS_POR_GRADO_LAT * Math.cos((punto.lat * Math.PI) / 180));

  return {
    lat: redondear(punto.lat + dLat),
    lng: redondear(punto.lng + dLng),
  };
}

/** ~11 m de resolución: suficiente para el mapa, sin arrastrar precisión de más. */
function redondear(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

/** Distancia en metros entre dos puntos (haversine). Para ordenar por cercanía. */
export function distanciaM(a: Punto, b: Punto): number {
  const R = 6_371_000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Centro aproximado de CABA. */
export const CENTRO_CABA: Punto = { lat: -34.6037, lng: -58.4438 };

/**
 * Encuadre inicial del mapa: Esgrima Centro Naval, en Olivos.
 * Decisión de producto, no técnica — es la sala de referencia del proyecto.
 */
export const CENTRO_MAPA: Punto = { lat: -34.513291, lng: -58.47495 };

/**
 * A propósito no entran todas las salas en el encuadre inicial: la app abre
 * cerca de Centro Naval y quien busque otra zona mueve el mapa. Es una
 * decisión de Felipe, no un descuido — no bajar este número "para que se vean
 * todas".
 */
export const ZOOM_INICIAL = 12;

/**
 * Zonas de entrega: el AMBA desagregado, y después todas las provincias.
 *
 * El área metropolitana va separada porque es donde está la comunidad y donde
 * la distinción importa de verdad: alguien de Palermo y alguien de San Isidro
 * no se cruzan por casualidad, aunque los dos digan "Buenos Aires".
 */
const BARRIOS_CABA = [
  "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo",
  "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución",
  "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos",
  "Monte Castro", "Montserrat", "Nueva Pompeya", "Núñez", "Palermo",
  "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios",
  "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal",
  "San Nicolás", "San Telmo", "Vélez Sarsfield", "Versalles",
  "Villa Crespo", "Villa del Parque", "Villa Devoto", "Villa General Mitre",
  "Villa Lugano", "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón",
  "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati",
  "Villa Urquiza",
] as const;

export type GrupoZona = "amba" | "provincias";

type Zona = {
  label: string;
  grupo: GrupoZona;
  barrios: readonly string[];
};

const provincia = (label: string): Zona => ({
  label,
  grupo: "provincias",
  barrios: [],
});

export const ZONAS = {
  caba: {
    label: "Ciudad de Buenos Aires",
    grupo: "amba",
    barrios: BARRIOS_CABA,
  },
  gba_norte: { label: "GBA Norte", grupo: "amba", barrios: [] },
  gba_oeste: { label: "GBA Oeste", grupo: "amba", barrios: [] },
  gba_sur: { label: "GBA Sur", grupo: "amba", barrios: [] },

  buenos_aires: provincia("Buenos Aires (resto)"),
  catamarca: provincia("Catamarca"),
  chaco: provincia("Chaco"),
  chubut: provincia("Chubut"),
  cordoba: provincia("Córdoba"),
  corrientes: provincia("Corrientes"),
  entre_rios: provincia("Entre Ríos"),
  formosa: provincia("Formosa"),
  jujuy: provincia("Jujuy"),
  la_pampa: provincia("La Pampa"),
  la_rioja: provincia("La Rioja"),
  mendoza: provincia("Mendoza"),
  misiones: provincia("Misiones"),
  neuquen: provincia("Neuquén"),
  rio_negro: provincia("Río Negro"),
  salta: provincia("Salta"),
  san_juan: provincia("San Juan"),
  san_luis: provincia("San Luis"),
  santa_cruz: provincia("Santa Cruz"),
  santa_fe: provincia("Santa Fe"),
  santiago_del_estero: provincia("Santiago del Estero"),
  tierra_del_fuego: provincia("Tierra del Fuego"),
  tucuman: provincia("Tucumán"),
} as const satisfies Record<string, Zona>;

/** Para armar los dos bloques del formulario sin repetir la lista. */
export const ZONAS_AMBA = Object.entries(ZONAS).filter(
  ([, z]) => z.grupo === "amba",
) as [ZonaId, Zona][];

export const ZONAS_PROVINCIAS = Object.entries(ZONAS).filter(
  ([, z]) => z.grupo === "provincias",
) as [ZonaId, Zona][];

export type ZonaId = keyof typeof ZONAS;

/**
 * Texto de ubicación para mostrar. Prefiere el barrio, que es más útil que
 * "Ciudad de Buenos Aires"; si no hay, cae al nombre de la zona. Nunca
 * devuelve el identificador crudo.
 */
export function etiquetaUbicacion(zona: string, barrio?: string | null): string {
  if (barrio) return barrio;
  return ZONAS[zona as ZonaId]?.label ?? zona;
}

/**
 * Texto para varias zonas de entrega: "Palermo y GBA Norte".
 *
 * El barrio se usa para la de CABA, que es donde aporta algo; para las demás
 * alcanza el nombre de la zona.
 */
export function etiquetaZonas(zonas: string[], barrio?: string | null): string {
  const nombres = zonas.map((z) =>
    z === "caba" && barrio ? barrio : (ZONAS[z as ZonaId]?.label ?? z),
  );
  if (nombres.length <= 1) return nombres[0] ?? "";
  return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}
