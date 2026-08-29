"use client";

import { useState } from "react";

import { ZONAS_AMBA, ZONAS_PROVINCIAS } from "@/lib/geo";

/**
 * Selector de zonas de entrega.
 *
 * El AMBA queda siempre a la vista y las 23 provincias detrás de un botón:
 * son 27 opciones en total, y para la enorme mayoría de la gente la respuesta
 * está en las cuatro primeras. Mostrarlas todas de una convierte una decisión
 * de dos segundos en un muro de casillas.
 */
export function SelectorZonas({
  nombre,
  seleccionadas,
  alCambiar,
}: {
  nombre: string;
  seleccionadas: string[];
  alCambiar: (zonas: string[]) => void;
}) {
  const hayProvinciaElegida = ZONAS_PROVINCIAS.some(([id]) =>
    seleccionadas.includes(id),
  );
  const [verTodo, setVerTodo] = useState(hayProvinciaElegida);

  const alternar = (id: string, marcada: boolean) =>
    alCambiar(
      marcada ? [...seleccionadas, id] : seleccionadas.filter((x) => x !== id),
    );

  const Casilla = ({ id, label }: { id: string; label: string }) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={nombre}
        value={id}
        checked={seleccionadas.includes(id)}
        onChange={(e) => alternar(id, e.target.checked)}
        className="size-4 accent-[var(--acento)]"
      />
      <span>{label}</span>
    </label>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {ZONAS_AMBA.map(([id, z]) => (
          <Casilla key={id} id={id} label={z.label} />
        ))}
      </div>

      {!verTodo ? (
        <button
          type="button"
          onClick={() => setVerTodo(true)}
          className="text-sm text-acento underline"
        >
          ¿Estás en otra provincia?
        </button>
      ) : (
        <div className="rounded-lg border border-borde p-3">
          <p className="text-xs text-texto-suave mb-2">Resto del país</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ZONAS_PROVINCIAS.map(([id, z]) => (
              <Casilla key={id} id={id} label={z.label} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
