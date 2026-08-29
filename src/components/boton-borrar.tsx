"use client";

import { useState } from "react";

import { borrarPublicacion } from "@/acciones/publicar";

/**
 * Borrar es irreversible y se pierden también las fotos, así que pide
 * confirmación.
 *
 * Se usa un segundo click en lugar de `confirm()` del navegador porque el
 * diálogo nativo bloquea la página, se ve distinto en cada sistema, y en el
 * celular aparece pegado arriba de todo, lejos del botón que tocaste.
 */
export function BotonBorrar({ id, clase }: { id: string; clase: string }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className={`${clase} text-alerta hover:border-alerta`}
      >
        Borrar
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="text-texto-suave">¿Borrar para siempre?</span>
      <form action={borrarPublicacion} className="inline">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="rounded-lg bg-alerta text-white px-3 py-1.5 text-sm hover:opacity-90"
        >
          Sí, borrar
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className={clase}
      >
        No
      </button>
    </span>
  );
}
