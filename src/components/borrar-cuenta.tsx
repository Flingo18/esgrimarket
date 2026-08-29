"use client";

import { useActionState, useState } from "react";

import { borrarCuenta } from "@/acciones/cuenta";

/**
 * Zona de peligro del perfil.
 *
 * Pide escribir una palabra en vez de un simple click: borrar la cuenta se
 * lleva las publicaciones y las fotos, y no hay forma de recuperarlas.
 */
export function BorrarCuenta({ publicaciones }: { publicaciones: number }) {
  const [estado, accion, borrando] = useActionState(borrarCuenta, {});
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-texto-suave underline hover:text-alerta"
      >
        Borrar mi cuenta
      </button>
    );
  }

  return (
    <form
      action={accion}
      className="rounded-xl border border-alerta/40 bg-alerta/5 p-4 space-y-3"
    >
      <p className="font-medium text-alerta">Borrar la cuenta es definitivo</p>

      <ul className="text-sm text-texto-suave list-disc pl-5 space-y-1">
        <li>
          Se borran tus {publicaciones}{" "}
          {publicaciones === 1 ? "publicación" : "publicaciones"} y sus fotos.
        </li>
        <li>Se borran tu mail, tu teléfono y tus zonas de entrega.</li>
        <li>No se puede deshacer. Si volvés, empezás de cero.</li>
      </ul>

      <div>
        <label htmlFor="confirmacion" className="block text-sm mb-1.5">
          Escribí <strong>BORRAR</strong> para confirmar
        </label>
        <input
          id="confirmacion"
          name="confirmacion"
          autoComplete="off"
          className="w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2.5 outline-none focus:border-alerta"
        />
      </div>

      {estado.error && <p className="text-sm text-alerta">{estado.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={borrando}
          className="rounded-lg bg-alerta text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {borrando ? "Borrando…" : "Borrar mi cuenta"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg border border-borde px-4 py-2 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
