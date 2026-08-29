"use client";

import { useActionState } from "react";

import { moderarTorneo } from "@/acciones/torneos";
import { TIPOS_TORNEO, rangoDeFechas } from "@/lib/torneos";

export type TorneoPendiente = {
  id: string;
  nombre: string;
  tipo: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cierre_inscripcion: string | null;
  lugar: string | null;
  url_inscripcion: string | null;
  notas: string | null;
};

export function FilaTorneoPendiente({ torneo: t }: { torneo: TorneoPendiente }) {
  const [estado, accion, guardando] = useActionState(moderarTorneo, {});

  return (
    <li className="rounded-xl border border-borde bg-fondo-elevado p-3">
      <p className="text-xs text-texto-suave">
        {TIPOS_TORNEO[t.tipo as keyof typeof TIPOS_TORNEO]}
        {t.fecha_inicio
          ? ` · ${rangoDeFechas(t.fecha_inicio, t.fecha_fin)}`
          : " · sin fecha"}
      </p>
      <p className="font-medium">{t.nombre}</p>
      {t.lugar && <p className="text-sm text-texto-suave">{t.lugar}</p>}
      {t.cierre_inscripcion && (
        <p className="text-sm text-texto-suave">
          Cierre de inscripción: {t.cierre_inscripcion}
        </p>
      )}
      {t.notas && <p className="text-sm italic text-texto-suave mt-1">“{t.notas}”</p>}
      {t.url_inscripcion && (
        <a
          href={t.url_inscripcion}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-acento underline"
        >
          Ver el link de inscripción
        </a>
      )}

      {estado?.error && <p className="text-sm text-alerta mt-1">{estado.error}</p>}

      <div className="mt-3 flex gap-2">
        {(["aprobado", "rechazado"] as const).map((decision) => (
          <form key={decision} action={accion}>
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="decision" value={decision} />
            <button
              type="submit"
              disabled={guardando}
              className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 ${
                decision === "aprobado"
                  ? "border-precio text-precio hover:bg-precio/10"
                  : "border-borde text-texto-suave hover:border-alerta hover:text-alerta"
              }`}
            >
              {decision === "aprobado" ? "Aprobar" : "Rechazar"}
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}
