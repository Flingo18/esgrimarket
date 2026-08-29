"use client";

import { useEffect } from "react";

import {
  colorFederacion,
  diasHasta,
  haceCuanto,
  interpretarContacto,
  rangoDeFechas,
} from "@/lib/torneos";

export type TorneoDetalle = {
  id: string;
  nombre: string;
  federacion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cierre_inscripcion: string | null;
  lugar: string | null;
  contacto_inscripcion: string | null;
  notas: string | null;
  actualizado_en: string;
};

/**
 * Ficha del torneo en una capa por encima.
 *
 * Se abre acá y no debajo del calendario para no empujar la grilla hacia
 * abajo: el mes tiene que quedar donde estaba cuando cerrás.
 */
export function ModalTorneo({
  torneo,
  alCerrar,
}: {
  torneo: TorneoDetalle | null;
  alCerrar: () => void;
}) {
  useEffect(() => {
    if (!torneo) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    document.addEventListener("keydown", alTecla);
    // Sin esto la página de atrás sigue desplazándose bajo la capa.
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTecla);
      document.body.style.overflow = previo;
    };
  }, [torneo, alCerrar]);

  if (!torneo) return null;

  const contacto = interpretarContacto(torneo.contacto_inscripcion);
  const dias = torneo.cierre_inscripcion ? diasHasta(torneo.cierre_inscripcion) : null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center
                 bg-black/60 p-0 sm:p-4"
      onClick={alCerrar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={torneo.nombre}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto
                   rounded-t-2xl sm:rounded-2xl border border-borde
                   bg-fondo-elevado p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`text-xs rounded-md px-2 py-0.5 font-medium ${colorFederacion(
              torneo.federacion,
            )}`}
          >
            {torneo.federacion ?? "Sin federación"}
          </span>
          <button
            type="button"
            onClick={alCerrar}
            className="text-texto-suave hover:text-texto text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <h2 className="mt-2 text-lg font-semibold leading-snug">{torneo.nombre}</h2>

        {torneo.fecha_inicio && (
          <p className="mt-1 font-medium">
            {rangoDeFechas(torneo.fecha_inicio, torneo.fecha_fin)}
          </p>
        )}
        {torneo.lugar && <p className="text-texto-suave">{torneo.lugar}</p>}

        {dias !== null && (
          <p className={`mt-3 text-sm ${dias >= 0 && dias <= 10 ? "text-alerta" : "text-texto-suave"}`}>
            {dias < 0
              ? "La inscripción ya cerró"
              : dias === 0
                ? "La inscripción cierra hoy"
                : `Cierra la inscripción en ${dias} ${dias === 1 ? "día" : "días"}`}
          </p>
        )}

        {torneo.notas && (
          <p className="mt-3 text-sm text-texto-suave whitespace-pre-line">
            {torneo.notas}
          </p>
        )}

        <div className="mt-5">
          <p className="text-sm font-medium mb-2">Dónde inscribirse</p>
          {contacto ? (
            <a
              href={contacto.href}
              target={contacto.tipo === "mail" ? undefined : "_blank"}
              rel="noreferrer"
              className={`block w-full text-center rounded-lg font-medium py-2.5 ${
                contacto.tipo === "whatsapp"
                  ? "bg-precio text-white"
                  : "bg-acento text-acento-texto"
              } hover:opacity-90`}
            >
              {contacto.texto}
            </a>
          ) : (
            <p className="text-sm text-texto-suave">
              {torneo.contacto_inscripcion ?? "No hay datos de inscripción cargados."}
            </p>
          )}
        </div>

        {/* Las fechas se reprograman seguido: saber cuándo se tocó por última
            vez es lo que permite confiar —o no— en lo que dice la ficha. */}
        <p className="mt-5 pt-3 border-t border-borde text-xs text-texto-suave">
          Información actualizada {haceCuanto(torneo.actualizado_en)}
        </p>
      </div>
    </div>
  );
}
