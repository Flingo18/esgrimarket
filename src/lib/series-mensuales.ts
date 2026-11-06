/**
 * Contar cosas por mes, en hora argentina.
 *
 * Vive separado del componente que lo dibuja porque es la parte que puede
 * estar mal sin que se note: un gráfico con los meses corridos se ve
 * perfecto. Acá se puede ejecutar contra la base y comparar con un `group by`.
 */

export const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Las fechas se guardan en UTC. Agrupar sin convertir corre de mes todo lo
// que pasó después de las 21 del último día, que acá es horario pico.
const FORMATO = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
});

/** Índice absoluto de mes, para restar meses sin pelear con el calendario. */
export function indiceMes(iso: string | Date): number {
  const fecha = iso instanceof Date ? iso : new Date(iso);
  const partes = Object.fromEntries(
    FORMATO.formatToParts(fecha).map((p) => [p.type, p.value]),
  );
  return Number(partes.year) * 12 + (Number(partes.month) - 1);
}

/** "nov 2026", para encabezados y tablas. */
export function mesYAnio(i: number): string {
  return `${MESES[i % 12]} ${Math.floor(i / 12)}`;
}

export type Punto = { clave: number; etiqueta: string; valor: number };

/**
 * Los meses a mostrar: desde el primero con datos hasta el actual, sin
 * saltearse los vacíos y sin pasar de `maximo`.
 */
export function rangoDeMeses(
  fechas: string[],
  hoy: Date,
  maximo = 12,
): number[] {
  if (fechas.length === 0) return [];

  const hasta = indiceMes(hoy);
  const primero = Math.min(...fechas.map((f) => indiceMes(f)));
  const desde = Math.max(primero, hasta - (maximo - 1));

  const claves: number[] = [];
  for (let i = desde; i <= hasta; i++) claves.push(i);
  return claves;
}

/**
 * Cuántas de `fechas` caen en cada mes de `claves`.
 *
 * Bajo cada barra va sólo el mes: con doce columnas, "dic 26" no entra en el
 * ancho de una y se parte en dos líneas. El año va en el encabezado.
 */
export function contar(fechas: string[], claves: number[]): Punto[] {
  const cuenta = new Map<number, number>();
  for (const f of fechas) {
    const i = indiceMes(f);
    cuenta.set(i, (cuenta.get(i) ?? 0) + 1);
  }
  return claves.map((i) => ({
    clave: i,
    etiqueta: MESES[i % 12],
    valor: cuenta.get(i) ?? 0,
  }));
}
