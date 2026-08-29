"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";

import { proponerSala } from "@/acciones/salas";
import { ZONAS, ZONAS_AMBA, ZONAS_PROVINCIAS, type Punto } from "@/lib/geo";

const CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2.5 " +
  "outline-none focus:border-acento";

const MapaSelector = dynamic(() => import("@/components/mapa-selector"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-lg border border-borde bg-fondo-sutil grid place-items-center text-sm text-texto-suave">
      Cargando el mapa…
    </div>
  ),
});

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{etiqueta}</label>
      {children}
      {ayuda && <p className="text-xs text-texto-suave mt-1">{ayuda}</p>}
    </div>
  );
}

export function FormularioSala() {
  const [estado, accion, enviando] = useActionState(proponerSala, {});
  const [zona, setZona] = useState("");
  const [punto, setPunto] = useState<Punto | null>(null);

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-precio/40 bg-precio/10 p-4">
        <p className="text-precio">{estado.ok}</p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      <Campo etiqueta="Nombre de la sala">
        <input name="nombre" required maxLength={80} className={CAMPO} />
      </Campo>

      <Campo etiqueta="Dirección" ayuda="Calle y altura, si la sabés.">
        <input name="direccion" maxLength={120} className={CAMPO} />
      </Campo>

      <Campo etiqueta="Zona">
        <select
          name="zona"
          required
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          className={CAMPO}
        >
          <option value="">Elegí una…</option>
          <optgroup label="Buenos Aires">
            {ZONAS_AMBA.map(([id, z]) => (
              <option key={id} value={id}>{z.label}</option>
            ))}
          </optgroup>
          <optgroup label="Resto del país">
            {ZONAS_PROVINCIAS.map(([id, z]) => (
              <option key={id} value={id}>{z.label}</option>
            ))}
          </optgroup>
        </select>
      </Campo>

      {zona === "caba" && (
        <Campo etiqueta="Barrio">
          <select name="barrio" className={CAMPO} defaultValue="">
            <option value="">Sin especificar</option>
            {ZONAS.caba.barrios.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Campo>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Campo etiqueta="Teléfono">
          <input name="telefono" className={CAMPO} placeholder="Opcional" />
        </Campo>
        <Campo etiqueta="Instagram">
          <input name="instagram" className={CAMPO} placeholder="@sala" />
        </Campo>
      </div>

      <Campo
        etiqueta="Ubicación en el mapa"
        ayuda="Tocá dónde está. Acá el punto es exacto: es un club, no un domicilio particular."
      >
        <MapaSelector valor={punto} alElegir={setPunto} difuminar={false} />
        {punto && (
          <>
            <input type="hidden" name="lat" value={punto.lat} />
            <input type="hidden" name="lng" value={punto.lng} />
          </>
        )}
      </Campo>

      <Campo etiqueta="Algo más que quieras contarnos">
        <textarea name="nota" rows={3} maxLength={500} className={CAMPO} />
      </Campo>

      {estado.error && (
        <p className="rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-acento text-acento-texto font-medium py-3 hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Proponer la sala"}
      </button>
    </form>
  );
}
