"use client";

import { useState } from "react";

import { ModalTorneo, type TorneoDetalle } from "./modal-torneo";
import type { CorreccionConCambios } from "@/lib/correcciones";
import {
  colorFederacion,
  diasHasta,
  nombreOrganizador,
  rangoDeFechas,
} from "@/lib/torneos";

/**
 * Listado de torneos. Abre la misma ficha que el calendario, para que tocar
 * un torneo haga siempre lo mismo, se llegue desde donde se llegue.
 */
export function ListaTorneos({
  torneos,
  correcciones,
}: {
  torneos: TorneoDetalle[];
  correcciones?: Map<string, CorreccionConCambios[]>;
}) {
  // Se guarda el id y no el torneo: después de avalar una corrección el
  // servidor devuelve datos nuevos, y una copia guardada en el estado
  // seguiría mostrando el aval que la persona acaba de dar como si no
  // hubiera pasado.
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const abierto = torneos.find((t) => t.id === abiertoId) ?? null;

  return (
    <>
      <ul className="mt-3 space-y-3">
        {torneos.map((t) => {
          const dias = t.cierre_inscripcion ? diasHasta(t.cierre_inscripcion) : null;
          const pendientes = correcciones?.get(t.id)?.length ?? 0;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setAbiertoId(t.id)}
                className="w-full text-left rounded-xl border border-borde bg-fondo-elevado p-4 hover:border-acento"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs rounded-md px-2 py-0.5 font-medium ${colorFederacion(
                      t.federacion,
                    )}`}
                  >
                    {nombreOrganizador(t.federacion, t.salas?.nombre)}
                  </span>
                  {t.fecha_inicio && (
                    <span className="text-sm font-medium">
                      {rangoDeFechas(t.fecha_inicio, t.fecha_fin)}
                    </span>
                  )}
                  {pendientes > 0 && (
                    <span className="text-xs rounded-md px-2 py-0.5 font-medium border border-acento text-acento">
                      {pendientes === 1
                        ? "1 corrección propuesta"
                        : `${pendientes} correcciones propuestas`}
                    </span>
                  )}
                </div>

                <p className="mt-1.5 font-medium leading-snug">{t.nombre}</p>
                {t.lugar && <p className="text-sm text-texto-suave">{t.lugar}</p>}

                {t.categorias && t.categorias.length > 0 && (
                  <p className="mt-1 text-xs text-texto-suave">
                    {t.categorias.map((c) => c.nombre).join(" · ")}
                  </p>
                )}

                {dias !== null && (
                  <p
                    className={`text-sm mt-1 ${
                      dias >= 0 && dias <= 10 ? "text-alerta" : "text-texto-suave"
                    }`}
                  >
                    {dias < 0
                      ? "Inscripción cerrada"
                      : dias === 0
                        ? "La inscripción cierra hoy"
                        : `Cierra la inscripción en ${dias} ${dias === 1 ? "día" : "días"}`}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <ModalTorneo
        torneo={abierto}
        correcciones={abierto ? correcciones?.get(abierto.id) : undefined}
        alCerrar={() => setAbiertoId(null)}
      />
    </>
  );
}
