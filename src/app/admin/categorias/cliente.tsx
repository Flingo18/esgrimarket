"use client";

import { useActionState, useState } from "react";

import { guardarCategoria } from "@/acciones/categorias";
import { FEDERACIONES, rangoEdad, type Categoria } from "@/lib/torneos";

const CAMPO =
  "rounded-lg border border-borde bg-fondo-elevado px-3 py-2 outline-none focus:border-acento";

/**
 * Alta y edición en la misma fila.
 *
 * Son trece categorías que casi nunca cambian: abrir una página por cada una
 * para tocar un número sería más navegación que trabajo.
 */
export function EditorCategoria({
  categoria,
  federacionPorDefecto,
}: {
  categoria?: Categoria & { activa: boolean };
  federacionPorDefecto?: string;
}) {
  const [estado, accion, enviando] = useActionState(guardarCategoria, {});
  const [abierto, setAbierto] = useState(false);

  if (categoria && !abierto) {
    return (
      <li className="rounded-xl border border-borde bg-fondo-elevado p-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className={`font-medium truncate ${categoria.activa ? "" : "text-texto-suave line-through"}`}>
            {categoria.nombre}
          </p>
          <p className="text-xs text-texto-suave">
            {rangoEdad(categoria.edad_desde, categoria.edad_hasta) || "sin edades cargadas"}
            {!categoria.activa && " · no se ofrece al cargar torneos"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="shrink-0 rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento"
        >
          Editar
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-acento/50 bg-fondo-elevado p-3">
      <form action={accion} className="space-y-3">
        {categoria && <input type="hidden" name="id" value={categoria.id} />}

        <div className="grid sm:grid-cols-2 gap-2">
          <input
            name="nombre"
            required
            maxLength={60}
            placeholder="Nombre de la categoría"
            defaultValue={categoria?.nombre ?? ""}
            className={CAMPO}
          />
          <select
            name="federacion"
            defaultValue={categoria?.federacion ?? federacionPorDefecto ?? ""}
            className={CAMPO}
          >
            <option value="">Elegí la federación…</option>
            {Object.entries(FEDERACIONES).map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            name="edad_desde"
            type="number"
            min={0}
            max={120}
            placeholder="Edad desde"
            defaultValue={categoria?.edad_desde ?? ""}
            className={`${CAMPO} w-32`}
          />
          <input
            name="edad_hasta"
            type="number"
            min={0}
            max={120}
            placeholder="Edad hasta"
            defaultValue={categoria?.edad_hasta ?? ""}
            className={`${CAMPO} w-32`}
          />
          <span className="text-xs text-texto-suave">
            Dejá vacío el segundo si no tiene tope.
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="activa"
            value="si"
            defaultChecked={categoria?.activa ?? true}
            className="size-4 accent-[var(--acento)]"
          />
          <span>
            Se ofrece al cargar un torneo
            <span className="text-texto-suave">
              {" "}— destildá para retirarla sin perder los torneos que ya la usan
            </span>
          </span>
        </label>

        {estado.error && <p className="text-sm text-alerta">{estado.error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-1.5 hover:opacity-90 disabled:opacity-50"
          >
            {enviando ? "Guardando…" : "Guardar"}
          </button>
          {categoria && (
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-lg border border-borde px-3 py-1.5 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </li>
  );
}
