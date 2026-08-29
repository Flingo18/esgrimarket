"use client";

import { useActionState } from "react";

import { moderarSala } from "@/acciones/salas";
import { ZONAS, type ZonaId } from "@/lib/geo";

export type SalaPendiente = {
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
};

export function FilaSalaPendiente({ sala: s }: { sala: SalaPendiente }) {
  const [estado, accion, guardando] = useActionState(moderarSala, {});

  const ubicacion = [
    s.direccion,
    s.barrio,
    s.zona ? ZONAS[s.zona as ZonaId]?.label : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li className="rounded-xl border border-borde bg-fondo-elevado p-3">
      <p className="font-medium">{s.nombre}</p>
      <p className="text-sm text-texto-suave">{ubicacion || "Sin ubicación"}</p>

      {(s.telefono || s.instagram) && (
        <p className="text-sm text-texto-suave">
          {[s.telefono, s.instagram].filter(Boolean).join(" · ")}
        </p>
      )}

      {s.nota && <p className="text-sm mt-1 italic text-texto-suave">“{s.nota}”</p>}

      <p className="text-xs text-texto-suave mt-1">
        {s.lat !== null && s.lng !== null ? (
          <a
            href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=17/${s.lat}/${s.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-acento underline"
          >
            Ver el punto en el mapa
          </a>
        ) : (
          "Sin punto marcado — no va a aparecer en el mapa hasta cargarlo"
        )}
      </p>

      {estado.error && <p className="text-sm text-alerta mt-1">{estado.error}</p>}
      {estado.ok && <p className="text-sm text-precio mt-1">{estado.ok}</p>}

      <div className="mt-3 flex gap-2">
        {(["aprobada", "rechazada"] as const).map((decision) => (
          <form key={decision} action={accion}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="decision" value={decision} />
            <button
              type="submit"
              disabled={guardando}
              className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 ${
                decision === "aprobada"
                  ? "border-precio text-precio hover:bg-precio/10"
                  : "border-borde text-texto-suave hover:border-alerta hover:text-alerta"
              }`}
            >
              {decision === "aprobada" ? "Aprobar" : "Rechazar"}
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}
