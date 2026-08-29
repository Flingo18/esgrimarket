/**
 * Cotización del dólar blue.
 *
 * Decisión de diseño: los precios NO se reescriben en la base. Cada
 * publicación guarda un monto y su moneda de origen, y la conversión se
 * calcula al momento de mostrar. Así nunca hay un precio viejo dando vueltas
 * ni un job nocturno que pueda fallar en silencio.
 *
 * Tres niveles de respaldo, en orden: dolarapi → bluelytics → último valor
 * guardado en la base. Si los tres fallan, la app muestra sólo la moneda
 * original en vez de inventar un número.
 */

import type { Moneda } from "./taxonomy";

export type Cotizacion = {
  /** Precio de venta, que es el que paga quien compra dólares. */
  venta: number;
  actualizado: string;
  fuente: string;
};

/** Cada 30 minutos alcanza: el blue no se mueve más rápido que eso. */
const REVALIDAR_SEGUNDOS = 1800;

type Fuente = {
  nombre: string;
  url: string;
  extraer: (json: unknown) => Cotizacion | null;
};

const FUENTES: Fuente[] = [
  {
    nombre: "dolarapi",
    url: "https://dolarapi.com/v1/dolares/blue",
    extraer: (json) => {
      const j = json as { venta?: number; fechaActualizacion?: string };
      if (typeof j.venta !== "number") return null;
      return {
        venta: j.venta,
        actualizado: j.fechaActualizacion ?? new Date().toISOString(),
        fuente: "dolarapi",
      };
    },
  },
  {
    nombre: "bluelytics",
    url: "https://api.bluelytics.com.ar/v2/latest",
    extraer: (json) => {
      const j = json as { blue?: { value_sell?: number }; last_update?: string };
      if (typeof j.blue?.value_sell !== "number") return null;
      return {
        venta: j.blue.value_sell,
        actualizado: j.last_update ?? new Date().toISOString(),
        fuente: "bluelytics",
      };
    },
  },
];

/**
 * Devuelve la cotización vigente, o `null` si no hay ninguna disponible.
 * Nunca lanza: una API caída no puede tirar abajo el listado.
 */
export async function obtenerCotizacion(): Promise<Cotizacion | null> {
  for (const fuente of FUENTES) {
    try {
      const res = await fetch(fuente.url, {
        next: { revalidate: REVALIDAR_SEGUNDOS, tags: ["cotizacion"] },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;

      const cotizacion = fuente.extraer(await res.json());
      if (cotizacion && cotizacion.venta > 0) return cotizacion;
    } catch {
      // Probamos la fuente siguiente.
    }
  }
  return null;
}

/* ────────────────────────── Conversión ─────────────────────────── */

export type PrecioMostrable = {
  usd: number | null;
  ars: number | null;
  monedaBase: Moneda;
  cotizacion: Cotizacion | null;
};

/**
 * Convierte un precio a ambas monedas. La moneda de origen queda intacta:
 * lo que el vendedor escribió es lo que vale, y la otra es una referencia.
 */
export function convertirPrecio(
  monto: number,
  monedaBase: Moneda,
  cotizacion: Cotizacion | null,
): PrecioMostrable {
  if (!cotizacion) {
    return {
      usd: monedaBase === "USD" ? monto : null,
      ars: monedaBase === "ARS" ? monto : null,
      monedaBase,
      cotizacion: null,
    };
  }

  return monedaBase === "USD"
    ? { usd: monto, ars: Math.round(monto * cotizacion.venta), monedaBase, cotizacion }
    : { usd: Math.round(monto / cotizacion.venta), ars: monto, monedaBase, cotizacion };
}

const FMT_USD = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const FMT_ARS = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

export function formatearUSD(monto: number): string {
  return `US$ ${FMT_USD.format(monto)}`;
}

export function formatearARS(monto: number): string {
  return `$ ${FMT_ARS.format(monto)}`;
}

/** "blue al 28/08" — para que nadie discuta de dónde salió el número. */
export function leyendaCotizacion(cotizacion: Cotizacion): string {
  const f = new Date(cotizacion.actualizado);
  const dia = String(f.getDate()).padStart(2, "0");
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  return `blue al ${dia}/${mes}`;
}
