"use client";

import dynamic from "next/dynamic";

import type { SalaMapa, ZonaMapa } from "./mapa";

/**
 * Leaflet toca `window` al importarse, así que no puede renderizarse en el
 * servidor. `ssr: false` sólo se puede usar desde un componente de cliente,
 * y de ahí que exista este envoltorio.
 */
const Mapa = dynamic(() => import("./mapa"), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] min-h-100 w-full rounded-xl border border-borde bg-fondo-sutil grid place-items-center text-texto-suave">
      Cargando el mapa…
    </div>
  ),
});

export function MapaCargador(props: { salas: SalaMapa[]; zonas: ZonaMapa[] }) {
  return <Mapa {...props} />;
}
