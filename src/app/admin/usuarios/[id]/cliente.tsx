"use client";

import { useActionState, useState } from "react";

import {
  bajarPublicacion,
  borrarCuentaAjena,
  cambiarSuspension,
  editarPerfilAjeno,
} from "@/acciones/admin";
import { CampoTelefono } from "@/components/campo-telefono";
import type { PaisId } from "@/lib/whatsapp";

const CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2 text-sm " +
  "outline-none focus:border-acento";

export function BajarPublicacion({ id }: { id: string }) {
  return (
    <form action={bajarPublicacion} className="shrink-0">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-borde px-3 py-1.5 text-sm text-texto-suave hover:border-alerta hover:text-alerta"
      >
        Bajar
      </button>
    </form>
  );
}

export function AccionesCuenta({
  usuario,
  nombre,
  telefono,
  pais,
  suspendido,
  esUnoMismo,
}: {
  usuario: string;
  nombre: string;
  telefono: string;
  pais: PaisId;
  suspendido: boolean;
  esUnoMismo: boolean;
}) {
  const [edicion, accionEditar, editando] = useActionState(editarPerfilAjeno, {});
  const [susp, accionSuspender, suspendiendo] = useActionState(cambiarSuspension, {});
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  if (esUnoMismo) {
    return (
      <p className="mt-6 text-sm text-texto-suave">
        Es tu propia cuenta: no podés suspenderla ni borrarla desde acá.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <form
        action={accionEditar}
        className="rounded-xl border border-borde bg-fondo-elevado p-4 space-y-3"
      >
        <p className="font-medium text-sm">Corregir datos</p>
        <input type="hidden" name="usuario" value={usuario} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            name="nombre"
            defaultValue={nombre}
            placeholder="Nombre"
            className={CAMPO}
          />
          <CampoTelefono
            valorInicial={telefono}
            paisInicial={pais}
            className={CAMPO}
          />
        </div>
        {edicion.error && <p className="text-sm text-alerta">{edicion.error}</p>}
        {edicion.ok && <p className="text-sm text-precio">{edicion.ok}</p>}
        <button
          type="submit"
          disabled={editando}
          className="rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento disabled:opacity-50"
        >
          {editando ? "Guardando…" : "Guardar"}
        </button>
      </form>

      <form
        action={accionSuspender}
        className="rounded-xl border border-borde bg-fondo-elevado p-4 space-y-3"
      >
        <input type="hidden" name="usuario" value={usuario} />
        <input type="hidden" name="suspender" value={suspendido ? "no" : "si"} />

        <p className="font-medium text-sm">
          {suspendido ? "Reactivar la cuenta" : "Suspender la cuenta"}
        </p>
        <p className="text-sm text-texto-suave">
          {suspendido
            ? "Vuelve a publicar y sus publicaciones reaparecen tal como estaban."
            : "Deja de publicar y sus publicaciones dejan de verse. No se borra nada y se puede revertir."}
        </p>

        {!suspendido && (
          <input
            name="motivo"
            placeholder="Motivo (opcional, sólo lo ves vos)"
            className={CAMPO}
          />
        )}

        {susp.error && <p className="text-sm text-alerta">{susp.error}</p>}
        {susp.ok && <p className="text-sm text-precio">{susp.ok}</p>}

        <button
          type="submit"
          disabled={suspendiendo}
          className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            suspendido
              ? "bg-precio text-white"
              : "border border-alerta text-alerta hover:bg-alerta/10"
          }`}
        >
          {suspendiendo
            ? "…"
            : suspendido
              ? "Reactivar"
              : "Suspender"}
        </button>
      </form>

      <div className="rounded-xl border border-alerta/40 bg-alerta/5 p-4">
        <p className="font-medium text-sm text-alerta">Borrar definitivamente</p>
        <p className="text-sm text-texto-suave mt-1">
          Se lleva la cuenta, sus publicaciones y sus fotos. No se puede
          deshacer. Para moderar conviene suspender, que es reversible.
        </p>

        {!confirmandoBorrado ? (
          <button
            type="button"
            onClick={() => setConfirmandoBorrado(true)}
            className="mt-3 rounded-lg border border-borde px-3 py-1.5 text-sm text-alerta hover:border-alerta"
          >
            Borrar la cuenta
          </button>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-texto-suave">¿Seguro?</span>
            <form action={borrarCuentaAjena}>
              <input type="hidden" name="usuario" value={usuario} />
              <button
                type="submit"
                className="rounded-lg bg-alerta text-white px-3 py-1.5 text-sm"
              >
                Sí, borrar
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirmandoBorrado(false)}
              className="rounded-lg border border-borde px-3 py-1.5 text-sm"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
