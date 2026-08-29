/**
 * Taxonomía de esgrima.
 *
 * Única fuente de verdad del dominio: de acá salen los campos del formulario
 * de publicación, los filtros del listado y los schemas de validación.
 *
 * La idea central es que cada tipo de ítem trae su propia metadata (con qué
 * armas sirve, si lleva talle y en qué escala, si la mano importa, si lleva
 * certificación). El formulario lee esa metadata y se arma solo, en vez de
 * tener un if por cada prenda desparramado por la UI.
 */

/* ──────────────────────────────── Armas ─────────────────────────── */

export const ARMAS = {
  florete: "Florete",
  espada: "Espada",
  sable: "Sable",
} as const;

export type Arma = keyof typeof ARMAS;

export const TODAS_LAS_ARMAS = ["florete", "espada", "sable"] as const;

/* ────────────────────────────── Categorías ──────────────────────── */

export const CATEGORIAS = {
  armas: "Armas y componentes",
  ropa: "Ropa y protección",
  electronica: "Electrónica y cables",
  accesorios: "Accesorios y equipamiento",
} as const;

export type Categoria = keyof typeof CATEGORIAS;

/* ──────────────────────── Metadata de cada tipo ─────────────────── */

/** Escalas de talle. Cada ítem usa la suya: una careta no va en talle 42. */
export const ESCALAS_TALLE = {
  europeo: ["28","30","32","34","36","38","40","42","44","46","48","50","52","54"],
  letra: ["XS", "S", "M", "L", "XL"],
  calzado: ["34","35","36","37","38","39","40","41","42","43","44","45","46"],
  hoja: ["0", "2", "3", "4", "5"],
  cable: ["Corto", "Estándar", "Largo"],
} as const;

export type EscalaTalle = keyof typeof ESCALAS_TALLE;

/**
 * `siempre` / `nunca`: el ítem es eléctrico por definición (un lamé siempre,
 * un pantalón nunca) y no tiene sentido preguntarlo.
 * `segun`: depende de la pieza concreta, así que el formulario pregunta.
 */
export type Electricidad = "siempre" | "nunca" | "segun";

export type MetaTipo = {
  label: string;
  /** Armas con las que sirve. El formulario limita las opciones a este conjunto. */
  armas: readonly Arma[];
  electricidad: Electricidad;
  /** Escala de talle, o null si el ítem no lleva talle. */
  talle: EscalaTalle | null;
  /** true si diestro/zurdo cambia la pieza. */
  mano: boolean;
  /** true si lleva certificación 350N/800N. */
  proteccion: boolean;
};

/* ─────────────────────── Armas y componentes ────────────────────── */

export const TIPOS_ARMAS: Record<string, MetaTipo> = {
  completa: {
    label: "Arma completa",
    armas: TODAS_LAS_ARMAS,
    electricidad: "segun",
    talle: "hoja",
    mano: true,
    proteccion: false,
  },
  hoja: {
    label: "Hoja (lámina)",
    armas: TODAS_LAS_ARMAS,
    electricidad: "segun",
    talle: "hoja",
    mano: false,
    proteccion: false,
  },
  cazoleta: {
    label: "Cazoleta",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: null,
    mano: false,
    proteccion: false,
  },
  empunadura: {
    label: "Empuñadura",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: null,
    // Una pistola de zurdo es inutilizable para un diestro.
    mano: true,
    proteccion: false,
  },
  pomo: {
    label: "Pomo",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: null,
    mano: false,
    proteccion: false,
  },
  punta: {
    label: "Punta / botón",
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
  instalacion: {
    label: "Instalación (cableado interno)",
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
  tomacorriente: {
    label: "Tomacorriente",
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
  repuestos: {
    label: "Tornillos y repuestos varios",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: null,
    mano: false,
    proteccion: false,
  },
};

/** Tipo de empuñadura, sólo cuando el ítem es un arma completa o una empuñadura. */
export const EMPUNADURAS = {
  francesa: "Francesa",
  pistola: "Pistola / ortopédica",
  otra: "Otra",
} as const;

export type Empunadura = keyof typeof EMPUNADURAS;

export const TIPOS_CON_EMPUNADURA = ["completa", "empunadura"] as const;

/* ────────────────────────── Ropa y protección ───────────────────── */

export const TIPOS_ROPA: Record<string, MetaTipo> = {
  chaqueta: {
    label: "Chaqueta blanca",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: "europeo",
    mano: true,
    proteccion: true,
  },
  lame: {
    label: "Chaquetilla eléctrica (lamé)",
    // La espada no lleva lamé: el blanco válido es todo el cuerpo.
    armas: ["florete", "sable"],
    electricidad: "siempre",
    talle: "europeo",
    mano: true,
    proteccion: false,
  },
  pantalon: {
    label: "Pantalón",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: "europeo",
    mano: false,
    proteccion: true,
  },
  careta: {
    label: "Careta",
    armas: TODAS_LAS_ARMAS,
    // La de espada es común; la de florete lleva babero conductor y la de
    // sable es conductora entera. Por eso se pregunta.
    electricidad: "segun",
    talle: "letra",
    mano: false,
    proteccion: true,
  },
  peto: {
    label: "Peto / protector de pecho",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: "letra",
    mano: false,
    proteccion: true,
  },
  guantes: {
    label: "Guante",
    armas: TODAS_LAS_ARMAS,
    electricidad: "segun",
    talle: "letra",
    mano: true,
    proteccion: false,
  },
  manchette: {
    label: "Manguito eléctrico (manchette)",
    armas: ["sable"],
    electricidad: "siempre",
    talle: "letra",
    mano: true,
    proteccion: false,
  },
  protector_axila: {
    label: "Protector de axila (plastrón)",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: "europeo",
    mano: true,
    proteccion: true,
  },
  medias: {
    label: "Medias",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: "calzado",
    mano: false,
    proteccion: false,
  },
  zapatillas: {
    label: "Zapatillas",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: "calzado",
    mano: false,
    proteccion: false,
  },
};

/* ───────────────────── Electrónica y cables ─────────────────────── */

export const TIPOS_ELECTRONICA: Record<string, MetaTipo> = {
  cable_arma: {
    // "Pasante" es como le dice la mayoría acá; van los dos nombres para que
    // aparezca lo busques como lo busques.
    label: "Cable de arma (pasante)",
    // Florete y sable comparten cable; el de espada va cableado distinto.
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: "cable",
    mano: false,
    proteccion: false,
  },
  cable_careta: {
    label: "Cable de careta",
    // Sólo florete y sable conectan la careta al circuito.
    armas: ["florete", "sable"],
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
  carretel: {
    label: "Carretel",
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
  aparato: {
    label: "Aparato / caja de señalización",
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
  cable_pista: {
    label: "Cable de pista / prolongador",
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
  pista: {
    label: "Pista metálica",
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
  otro_electronica: {
    label: "Otro equipo eléctrico",
    armas: TODAS_LAS_ARMAS,
    electricidad: "siempre",
    talle: null,
    mano: false,
    proteccion: false,
  },
};

/* ───────────────────── Accesorios y equipamiento ────────────────── */

export const TIPOS_ACCESORIOS: Record<string, MetaTipo> = {
  bolso: {
    label: "Bolso / mochila",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: null,
    mano: false,
    proteccion: false,
  },
  bolso_rodante: {
    label: "Bolso rodante",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: null,
    mano: false,
    proteccion: false,
  },
  ropa_presentacion: {
    label: "Ropa de presentación / podio",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: "europeo",
    mano: false,
    proteccion: false,
  },
  herramientas: {
    label: "Herramientas de armado",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: null,
    mano: false,
    proteccion: false,
  },
  libros: {
    label: "Libros y material de estudio",
    armas: TODAS_LAS_ARMAS,
    electricidad: "nunca",
    talle: null,
    mano: false,
    proteccion: false,
  },
  otro: {
    label: "Otro",
    armas: TODAS_LAS_ARMAS,
    electricidad: "segun",
    talle: null,
    mano: false,
    proteccion: false,
  },
};

/** Todos los tipos, indexados por categoría. */
export const TIPOS_POR_CATEGORIA: Record<Categoria, Record<string, MetaTipo>> = {
  armas: TIPOS_ARMAS,
  ropa: TIPOS_ROPA,
  electronica: TIPOS_ELECTRONICA,
  accesorios: TIPOS_ACCESORIOS,
};

export function metaTipo(categoria: Categoria, tipo: string): MetaTipo | null {
  return TIPOS_POR_CATEGORIA[categoria]?.[tipo] ?? null;
}

/* ───────────────────── Atributos transversales ──────────────────── */

/**
 * Chaquetas, lamés, guantes y empuñaduras son asimétricos. Sin este filtro,
 * a un zurdo la mitad del catálogo no le sirve.
 */
export const MANOS = {
  diestro: "Diestro",
  zurdo: "Zurdo",
  indistinto: "Indistinto",
} as const;

export type Mano = keyof typeof MANOS;

export const NIVELES_PROTECCION = {
  n800: "800N (FIE)",
  n350: "350N",
  sin_certificar: "Sin certificar",
  no_aplica: "No sé / no aplica",
} as const;

export type NivelProteccion = keyof typeof NIVELES_PROTECCION;

export const ESTADOS = {
  nuevo: "Nuevo",
  usado_excelente: "Usado — excelente",
  usado_bueno: "Usado — bueno",
  usado_repuestos: "Para repuestos o reparar",
} as const;

export type Estado = keyof typeof ESTADOS;

export const MONEDAS = { USD: "Dólares", ARS: "Pesos" } as const;
export type Moneda = keyof typeof MONEDAS;

/**
 * Marcas frecuentes, como sugerencia. El campo acepta texto libre: la lista
 * es para que no queden veinte formas de escribir "Leon Paul".
 */
export const MARCAS_SUGERIDAS = [
  "Leon Paul", "Allstar", "Uhlmann", "PBT", "Negrini", "Prieur", "StM",
  "Absolute Fencing", "Blue Gauntlet", "Triplette", "Dynamo", "Vniti",
] as const;

/**
 * Año de fabricación. Importa sobre todo en ropa: la tela pierde resistencia
 * con los años y los lavados, y una chaqueta FIE vieja no es lo mismo que una
 * nueva aunque las dos digan 800N.
 */
export const ANIO_MINIMO = 1970;
export const anioMaximo = () => new Date().getFullYear();
