"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";

import { actualizarSala, proponerSala } from "@/acciones/salas";
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

export type SalaEditable = {
  id: string;
  nombre: string;
  direccion: string | null;
  barrio: string | null;
  zona: string | null;
  telefono: string | null;
  instagram: string | null;
  nota: string | null;
  lat: number | null;
  lng: number | null;
  activa: boolean;
};

/**
 * Sirve para proponer una sala, para editarla y para corregir la de otro.
 * `puedeEditar` cambia el botón y muestra el motivo; `esAdmin` es lo único
 * que habilita esconderla del mapa, que es moderar y no corregir.
 */
export function FormularioSala({
  inicial,
  puedeEditar = true,
  esAdmin = false,
}: {
  inicial?: SalaEditable;
  puedeEditar?: boolean;
  esAdmin?: boolean;
}) {
  const editando = Boolean(inicial);
  const sugiriendo = editando && !puedeEditar;
  const [estado, accion, enviando] = useActionState(
    editando ? actualizarSala : proponerSala,
    {},
  );
  const [zona, setZona] = useState(inicial?.zona ?? "");
  const [punto, setPunto] = useState<Punto | null>(
    inicial?.lat != null && inicial?.lng != null
      ? { lat: inicial.lat, lng: inicial.lng }
      : null,
  );

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-precio/40 bg-precio/10 p-4">
        <p className="text-precio">{estado.ok}</p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      {inicial && <input type="hidden" name="id" value={inicial.id} />}

      <Campo etiqueta="Nombre de la sala">
        <input
          name="nombre"
          required
          maxLength={80}
          defaultValue={inicial?.nombre ?? ""}
          className={CAMPO}
        />
      </Campo>

      <Campo etiqueta="Dirección" ayuda="Calle y altura, si la sabés.">
        <input
          name="direccion"
          maxLength={120}
          defaultValue={inicial?.direccion ?? ""}
          className={CAMPO}
        />
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
          <select name="barrio" className={CAMPO} defaultValue={inicial?.barrio ?? ""}>
            <option value="">Sin especificar</option>
            {ZONAS.caba.barrios.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Campo>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Campo etiqueta="Teléfono">
          <input
            name="telefono"
            className={CAMPO}
            placeholder="Opcional"
            defaultValue={inicial?.telefono ?? ""}
          />
        </Campo>
        <Campo etiqueta="Instagram">
          <input
            name="instagram"
            className={CAMPO}
            placeholder="@sala"
            defaultValue={inicial?.instagram ?? ""}
          />
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

      {editando && esAdmin && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="activa"
            value="si"
            defaultChecked={inicial?.activa ?? true}
            className="size-4 accent-[var(--acento)]"
          />
          <span>
            Visible en el mapa
            <span className="text-texto-suave">
              {" "}— destildá para ocultarla sin borrarla
            </span>
          </span>
        </label>
      )}

      <Campo etiqueta={editando ? "Nota interna" : "Algo más que quieras contarnos"}>
        <textarea
          name="nota"
          rows={3}
          maxLength={500}
          defaultValue={inicial?.nota ?? ""}
          className={CAMPO}
        />
      </Campo>

      {sugiriendo && (
        <Campo
          etiqueta="¿De dónde sacaste el dato?"
          ayuda="Opcional, pero es lo que mira el que va a avalar la corrección."
        >
          <input
            name="motivo"
            maxLength={200}
            placeholder="Me lo dijeron en la sala"
            className={CAMPO}
          />
        </Campo>
      )}

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
        {enviando
          ? "Guardando…"
          : sugiriendo
            ? "Proponer la corrección"
            : editando
              ? "Guardar cambios"
              : "Proponer la sala"}
      </button>
    </form>
  );
}
