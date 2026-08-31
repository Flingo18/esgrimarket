"use client";

import { useState } from "react";

import { ModalTorneo, type TorneoDetalle } from "./modal-torneo";
import type { CorreccionConCambios } from "@/lib/correcciones";
import { colorFederacion, diasHasta, nombreOrganizador, rangoDeFechas } from "@/lib/torneos";

/**
 * Los torneos del home, en tarjetas chicas.
 *
 * Abren la misma ficha que el calendario y la misma lista: quien se entera
 * acá de que una fecha cambió tiene que poder decirlo sin ir a buscar dónde,
 * porque si hay que buscar nadie avisa.
 */
export function GrillaTorneos({
  torneos,
  correcciones,
}: {
  torneos: TorneoDetalle[];
  correcciones?: Map<string, CorreccionConCambios[]>;
}) {
  // El id y no el torneo: después de avalar una corrección el servidor manda
  // datos nuevos, y una copia guardada en el estado mostraría los viejos.
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const abierto = torneos.find((t) => t.id === abiertoId) ?? null;

  return (
    <>
      <ul className="mt-3 grid sm:grid-cols-2 gap-2">
        {torneos.map((t) => {
          const dias = t.cierre_inscripcion ? diasHasta(t.cierre_inscripcion) : null;
          const pendientes = correcciones?.get(t.id)?.length ?? 0;

          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setAbiertoId(t.id)}
                className="w-full h-full text-left rounded-lg border border-borde bg-fondo-elevado p-3 hover:border-acento"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${colorFederacion(
                      t.federacion,
                    )}`}
                  >
                    {nombreOrganizador(t.federacion, t.salas?.nombre)}
                  </span>
                  <span className="text-sm font-medium">
                    {rangoDeFechas(t.fecha_inicio!, t.fecha_fin)}
                  </span>
                  {pendientes > 0 && (
                    <span className="text-xs rounded-md px-1.5 py-0.5 font-medium border border-acento text-acento">
                      {pendientes === 1
                        ? "1 corrección propuesta"
                        : `${pendientes} correcciones`}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm font-medium leading-snug">{t.nombre}</p>
                {t.lugar && <p className="text-xs text-texto-suave">{t.lugar}</p>}

                {t.categorias && t.categorias.length > 0 && (
                  <p className="mt-1 text-xs text-texto-suave">
                    {t.categorias.map((c) => c.nombre).join(" · ")}
                  </p>
                )}

                {dias !== null && dias >= 0 && (
                  <p
                    className={`text-xs mt-1 ${
                      dias <= 10 ? "text-alerta" : "text-texto-suave"
                    }`}
                  >
                    {dias === 0
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
