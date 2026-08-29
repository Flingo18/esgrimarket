/**
 * Federaciones, en lista cerrada.
 *
 * Un torneo lo organiza una federación o un club. Para el club se apunta a la
 * sala del mapa, así que esta lista sólo cubre lo federativo — que es estable
 * y se puede enumerar.
 *
 * Si falta alguna o algún nombre está mal, se corrige acá y nada más: los
 * torneos ya cargados no se tocan.
 */
export const FEDERACIONES = {
  fae: "FAE — Federación Argentina de Esgrima",
  fecba: "Federación de Esgrima de la Ciudad de Buenos Aires",
  cordoba: "Federación Cordobesa de Esgrima",
  santafe: "Federación Santafesina de Esgrima",
  mendoza: "Federación Mendocina de Esgrima",
  fueguina: "Federación de Esgrima Fueguina",
  internacional: "Internacional",
} as const;

export type FederacionId = keyof typeof FEDERACIONES;

/** Nombre corto, para las insignias donde no entra el completo. */
export const FEDERACION_CORTA: Record<string, string> = {
  fae: "FAE",
  fecba: "FECBA",
  cordoba: "Córdoba",
  santafe: "Santa Fe",
  mendoza: "Mendoza",
  fueguina: "Fueguina",
  internacional: "Internacional",
};

const COLORES: Record<string, string> = {
  fae: "bg-acento-suave text-acento",
  fecba: "bg-precio/15 text-precio",
  internacional: "bg-fondo-sutil text-texto-suave",
};

const PUNTOS: Record<string, string> = {
  fae: "var(--acento)",
  fecba: "var(--precio)",
  internacional: "var(--texto-suave)",
};

/** Etiqueta del organizador: la federación, o el nombre del club. */
export function nombreOrganizador(
  federacion?: string | null,
  club?: string | null,
): string {
  if (club) return club;
  if (federacion) return FEDERACION_CORTA[federacion] ?? federacion;
  return "Sin organizador";
}

export function colorFederacion(f?: string | null): string {
  return (f && COLORES[f]) || "bg-fondo-sutil text-texto-suave";
}

export function colorBarra(f?: string | null): string {
  return (f && PUNTOS[f]) || "var(--texto-suave)";
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * Las fechas vienen como 'YYYY-MM-DD' y se parsean a mano.
 *
 * `new Date('2026-03-14')` las interpreta como UTC y en Argentina las corre un
 * día para atrás: un torneo del 14 se muestra el 13. Es un clásico y sólo se
 * nota cuando alguien llega un día tarde.
 */
export function partes(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return { anio: a, mes: m - 1, dia: d };
}

export function aFecha(iso: string): Date {
  const { anio, mes, dia } = partes(iso);
  return new Date(anio, mes, dia);
}

export function mesDe(iso: string): string {
  const { anio, mes } = partes(iso);
  return `${MESES[mes]} de ${anio}`;
}

export function claveMes(iso: string): string {
  return iso.slice(0, 7);
}

/** "14 de marzo" o "24 de febrero al 1 de marzo". */
export function rangoDeFechas(inicio: string, fin?: string | null): string {
  const i = partes(inicio);
  if (!fin || fin === inicio) return `${i.dia} de ${MESES[i.mes]}`;

  const f = partes(fin);
  return i.mes === f.mes
    ? `${i.dia} al ${f.dia} de ${MESES[i.mes]}`
    : `${i.dia} de ${MESES[i.mes]} al ${f.dia} de ${MESES[f.mes]}`;
}

export function diasHasta(iso: string): number {
  const objetivo = aFecha(iso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);
}

/** "hace 3 días", para que se vea qué tan fresca es la información. */
export function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "hace un mes" : `hace ${meses} meses`;
}

/* ─────────────────── Contacto para inscribirse ─────────────────── */

export type Contacto =
  | { tipo: "link"; href: string; texto: string }
  | { tipo: "mail"; href: string; texto: string }
  | { tipo: "whatsapp"; href: string; texto: string }
  | null;

/**
 * Decide qué hacer con el contacto según lo que sea.
 *
 * El campo es uno solo porque para quien carga el torneo también es uno solo:
 * "dónde anotarse". Pegue un link, un mail o un teléfono, la app resuelve.
 */
export function interpretarContacto(valor?: string | null): Contacto {
  if (!valor) return null;
  const v = valor.trim();

  if (/^https?:\/\//i.test(v)) {
    return { tipo: "link", href: v, texto: "Anotarse" };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { tipo: "mail", href: `mailto:${v}`, texto: `Escribir a ${v}` };
  }

  const digitos = v.replace(/\D/g, "");
  if (digitos.length >= 8) {
    // Mismo criterio que en el resto de la app: Argentina móvil es 54 9 + 10.
    let d = digitos;
    if (d.startsWith("54")) d = d.slice(2);
    if (d.length > 10 && d.startsWith("9")) d = d.slice(1);
    if (d.startsWith("0")) d = d.slice(1);
    if (d.length > 10) {
      for (const i of [2, 3, 4]) {
        if (d.slice(i, i + 2) === "15" && d.length - 2 === 10) {
          d = d.slice(0, i) + d.slice(i + 2);
          break;
        }
      }
    }
    return {
      tipo: "whatsapp",
      href: `https://wa.me/549${d}`,
      texto: `Escribir por WhatsApp al ${v}`,
    };
  }

  // No parece ninguna de las tres: se muestra tal cual, sin inventar una acción.
  return null;
}
