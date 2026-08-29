"use client";

import { useActionState } from "react";

import { proponerTorneo } from "@/acciones/torneos";
import { TIPOS_TORNEO } from "@/lib/torneos";

const CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2.5 " +
  "outline-none focus:border-acento";

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{etiqueta}</label>
      {children}
      {ayuda && <p className="text-xs text-texto-suave mt-1">{ayuda}</p>}
    </div>
  );
}

export function FormularioTorneo() {
  const [estado, accion, enviando] = useActionState(proponerTorneo, {});

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-precio/40 bg-precio/10 p-4">
        <p className="text-precio">{estado.ok}</p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      <Campo etiqueta="Nombre del torneo">
        <input name="nombre" required maxLength={140} className={CAMPO} />
      </Campo>

      <Campo etiqueta="Tipo">
        <select name="tipo" required defaultValue="" className={CAMPO}>
          <option value="">Elegí uno…</option>
          {Object.entries(TIPOS_TORNEO).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </Campo>

      <div className="grid sm:grid-cols-2 gap-4">
        <Campo etiqueta="Fecha de inicio" ayuda="Dejala vacía si todavía no se confirmó.">
          <input name="fecha_inicio" type="date" className={CAMPO} />
        </Campo>
        <Campo etiqueta="Fecha de fin" ayuda="Sólo si dura más de un día.">
          <input name="fecha_fin" type="date" className={CAMPO} />
        </Campo>
      </div>

      <Campo
        etiqueta="Cierre de inscripción"
        ayuda="Es el dato que más se busca: la app avisa cuando faltan pocos días."
      >
        <input name="cierre_inscripcion" type="date" className={CAMPO} />
      </Campo>

      <Campo etiqueta="Lugar" ayuda="Ej: CeNARD, Ciudad de Buenos Aires.">
        <input name="lugar" maxLength={140} className={CAMPO} />
      </Campo>

      <Campo etiqueta="Link para anotarse">
        <input
          name="url_inscripcion"
          type="url"
          placeholder="https://…"
          className={CAMPO}
        />
      </Campo>

      <Campo etiqueta="Notas" ayuda="Obligatoriedad, categorías, lo que haga falta aclarar.">
        <textarea name="notas" rows={3} maxLength={500} className={CAMPO} />
      </Campo>

      {estado.error && (
        <p className="rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-acento text-acento-texto font-medium py-3 hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Proponer el torneo"}
      </button>
    </form>
  );
}
