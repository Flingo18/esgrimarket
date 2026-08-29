"use client";

import { useState } from "react";

import { ModalTorneo, type TorneoDetalle } from "./modal-torneo";
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
export function ListaTorneos({ torneos }: { torneos: TorneoDetalle[] }) {
  const [abierto, setAbierto] = useState<TorneoDetalle | null>(null);

  return (
    <>
      <ul className="mt-3 space-y-3">
        {torneos.map((t) => {
          const dias = t.cierre_inscripcion ? diasHasta(t.cierre_inscripcion) : null;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setAbierto(t)}
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
                </div>

                <p className="mt-1.5 font-medium leading-snug">{t.nombre}</p>
                {t.lugar && <p className="text-sm text-texto-suave">{t.lugar}</p>}

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

      <ModalTorneo torneo={abierto} alCerrar={() => setAbierto(null)} />
    </>
  );
}
