import {
  convertirPrecio,
  formatearARS,
  formatearUSD,
  leyendaCotizacion,
  type Cotizacion,
} from "@/lib/dolar";
import type { Moneda } from "@/lib/taxonomy";

/**
 * Muestra el precio en las dos monedas, con la original destacada.
 * Si no hay cotización disponible, muestra sólo la original en vez de
 * inventar una conversión.
 */
export function Precio({
  monto,
  monedaBase,
  cotizacion,
  grande = false,
}: {
  monto: number;
  monedaBase: string;
  cotizacion: Cotizacion | null;
  grande?: boolean;
}) {
  const p = convertirPrecio(monto, monedaBase as Moneda, cotizacion);
  const principal = p.monedaBase === "USD" ? formatearUSD(p.usd!) : formatearARS(p.ars!);
  const secundario =
    p.monedaBase === "USD"
      ? p.ars !== null
        ? formatearARS(p.ars)
        : null
      : p.usd !== null
        ? formatearUSD(p.usd)
        : null;

  return (
    <div>
      <div className={grande ? "text-3xl font-semibold" : "font-semibold"}>
        {principal}
      </div>
      {secundario && (
        <div className={`text-texto-suave ${grande ? "text-sm mt-1" : "text-xs"}`}>
          ≈ {secundario}
          {grande && p.cotizacion ? ` · ${leyendaCotizacion(p.cotizacion)}` : ""}
        </div>
      )}
    </div>
  );
}
