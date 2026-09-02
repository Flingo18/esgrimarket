"use client";

import { useActionState } from "react";

import { borrarAvisoTorneo, guardarAvisoTorneo } from "@/acciones/avisos-torneos";
import { ARMAS, TODAS_LAS_ARMAS } from "@/lib/taxonomy";
import {
  FEDERACIONES,
  categoriasPorFederacion,
  type Categoria,
} from "@/lib/torneos";

/**
 * "Avisame de torneos de espada".
 *
 * Sin nada tildado avisa de todos: es el caso más común y no tiene sentido
 * obligar a tildar las tres armas para pedir "todo".
 */
export function AvisosTorneos({
  categorias,
  actual,
}: {
  categorias: Categoria[];
  actual: { armas: string[]; categorias: string[] } | null;
}) {
  const [estado, accion, guardando] = useActionState(guardarAvisoTorneo, {});

  return (
    <div className="mt-8 rounded-xl border border-borde bg-fondo-elevado p-4">
      <h2 className="font-medium">Avisame de torneos</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Cada vez que se cargue un torneo que coincida, te llega un mail con la
        fecha y el cierre de inscripción.
      </p>

      <form action={accion} className="mt-4 space-y-4">
        <fieldset>
          <legend className="text-sm font-medium mb-1.5">Armas</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {TODAS_LAS_ARMAS.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="armas"
                  value={a}
                  defaultChecked={actual?.armas.includes(a)}
                  className="size-4 accent-[var(--acento)]"
                />
                <span>{ARMAS[a]}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-texto-suave mt-1.5">
            Si no tildás ninguna, te avisamos de todas.
          </p>
        </fieldset>

        {categorias.length > 0 && (
          <fieldset>
            <legend className="text-sm font-medium mb-1.5">
              Categorías <span className="text-texto-suave">(opcional)</span>
            </legend>
            <div className="space-y-2">
              {categoriasPorFederacion(categorias).map(([fed, grupo]) => (
                <div key={fed}>
                  <p className="text-xs text-texto-suave mb-1">
                    {FEDERACIONES[fed as keyof typeof FEDERACIONES] ?? fed}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {grupo.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="categorias"
                          value={c.id}
                          defaultChecked={actual?.categorias.includes(c.id)}
                          className="size-4 accent-[var(--acento)]"
                        />
                        <span>{c.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {estado.error && (
          <p className="rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="rounded-lg border border-precio/40 bg-precio/10 px-3 py-2 text-sm text-precio">
            {estado.ok}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50"
          >
            {guardando ? "Guardando…" : actual ? "Guardar cambios" : "Avisame"}
          </button>
          {actual && (
            <button
              type="submit"
              formAction={borrarAvisoTorneo}
              className="rounded-lg border border-borde px-3 py-2 text-sm text-texto-suave hover:text-alerta hover:border-alerta"
            >
              No avisarme más
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
