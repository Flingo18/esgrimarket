/**
 * Tipos de torneo. Salen de cómo los organiza la federación, no de una
 * clasificación inventada: quien busca sabe si le sirve un FECBA o un FAE.
 */
export const TIPOS_TORNEO = {
  fae: "FAE — Nacional",
  fecba: "FECBA — Metropolitano",
  internacional: "Internacional",
  otro: "Otro",
} as const;

export type TipoTorneo = keyof typeof TIPOS_TORNEO;

export const COLOR_TIPO: Record<string, string> = {
  fae: "bg-acento-suave text-acento",
  fecba: "bg-precio/15 text-precio",
  internacional: "bg-fondo-sutil text-texto-suave",
  otro: "bg-fondo-sutil text-texto-suave",
};

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
function partes(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return { anio: a, mes: m - 1, dia: d };
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
  const { anio, mes, dia } = partes(iso);
  const objetivo = new Date(anio, mes, dia);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);
}
