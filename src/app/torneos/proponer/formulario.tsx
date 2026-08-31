"use client";

import { useActionState, useState } from "react";

import { actualizarTorneo, proponerTorneo } from "@/acciones/torneos";
import { FEDERACIONES } from "@/lib/torneos";

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

type Sala = { id: string; nombre: string };

export type TorneoEditable = {
  id: string;
  nombre: string;
  organizador_tipo: string;
  federacion: string | null;
  sala_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cierre_inscripcion: string | null;
  lugar: string | null;
  contacto_inscripcion: string | null;
  notas: string | null;
};

/**
 * El mismo formulario sirve para cargar un torneo, para editarlo y para
 * proponerle una corrección. `puedeEditar` sólo cambia lo que dice el botón
 * y si se pide un motivo: quién guarda directo y quién propone lo decide el
 * servidor, no esta pantalla.
 */
export function FormularioTorneo({
  salas,
  inicial,
  puedeEditar = true,
}: {
  salas: Sala[];
  inicial?: TorneoEditable;
  puedeEditar?: boolean;
}) {
  const editando = Boolean(inicial);
  const sugiriendo = editando && !puedeEditar;
  const [estado, accion, enviando] = useActionState(
    editando ? actualizarTorneo : proponerTorneo,
    {},
  );
  const [organizador, setOrganizador] = useState<"federacion" | "club">(
    inicial?.organizador_tipo === "club" ? "club" : "federacion",
  );

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-precio/40 bg-precio/10 p-4">
        <p className="text-precio">{estado.ok}</p>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      {inicial && <input type="hidden" name="id" value={inicial.id} />}

      <Campo etiqueta="Nombre del torneo">
        <input
          name="nombre"
          required
          maxLength={140}
          defaultValue={inicial?.nombre ?? ""}
          className={CAMPO}
        />
      </Campo>

      <Campo etiqueta="¿Quién lo organiza?">
        <div className="flex gap-4">
          {(
            [
              ["federacion", "Una federación"],
              ["club", "Un club"],
            ] as const
          ).map(([valor, etiqueta]) => (
            <label key={valor} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="organizador_tipo"
                value={valor}
                checked={organizador === valor}
                onChange={() => setOrganizador(valor)}
                className="size-4 accent-[var(--acento)]"
              />
              <span>{etiqueta}</span>
            </label>
          ))}
        </div>
      </Campo>

      {organizador === "federacion" ? (
        <Campo etiqueta="Federación">
          <select
            name="federacion"
            required
            defaultValue={inicial?.federacion ?? ""}
            className={CAMPO}
          >
            <option value="">Elegí una…</option>
            {Object.entries(FEDERACIONES).map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>
        </Campo>
      ) : (
        <Campo
          etiqueta="Club organizador"
          ayuda="Salen del mapa de salas. Si falta el club, agregalo primero desde el mapa."
        >
          <select
            name="sala_id"
            required
            defaultValue={inicial?.sala_id ?? ""}
            className={CAMPO}
          >
            <option value="">Elegí uno…</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </Campo>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Campo etiqueta="Fecha de inicio" ayuda="Dejala vacía si todavía no se confirmó.">
          <input
            name="fecha_inicio"
            type="date"
            defaultValue={inicial?.fecha_inicio ?? ""}
            className={CAMPO}
          />
        </Campo>
        <Campo etiqueta="Fecha de fin" ayuda="Sólo si dura más de un día.">
          <input
            name="fecha_fin"
            type="date"
            defaultValue={inicial?.fecha_fin ?? ""}
            className={CAMPO}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Cierre de inscripción"
        ayuda="Es el dato que más se busca: la app avisa cuando faltan pocos días."
      >
        <input
          name="cierre_inscripcion"
          type="date"
          defaultValue={inicial?.cierre_inscripcion ?? ""}
          className={CAMPO}
        />
      </Campo>

      <Campo etiqueta="Lugar" ayuda="Ej: CeNARD, Ciudad de Buenos Aires.">
        <input
          name="lugar"
          maxLength={140}
          defaultValue={inicial?.lugar ?? ""}
          className={CAMPO}
        />
      </Campo>

      <Campo
        etiqueta="Dónde inscribirse"
        ayuda="Un link, un mail o un teléfono. Según lo que pongas, el botón abre la página, el correo o WhatsApp."
      >
        <input
          name="contacto_inscripcion"
          maxLength={200}
          defaultValue={inicial?.contacto_inscripcion ?? ""}
          placeholder="https://…  ·  inscripciones@club.com  ·  11 1234-5678"
          className={CAMPO}
        />
      </Campo>

      <Campo etiqueta="Notas" ayuda="Obligatoriedad, categorías, lo que haga falta aclarar.">
        <textarea
          name="notas"
          rows={3}
          maxLength={500}
          defaultValue={inicial?.notas ?? ""}
          className={CAMPO}
        />
      </Campo>

      {sugiriendo && (
        <Campo
          etiqueta="¿De dónde sacaste el dato?"
          ayuda="Opcional, pero es lo que mira el que va a avalar la corrección. Un link a la circular o al posteo alcanza."
        >
          <input
            name="motivo"
            maxLength={200}
            placeholder="Lo publicó la FECBA el martes"
            className={CAMPO}
          />
        </Campo>
      )}

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
        {enviando
          ? "Guardando…"
          : sugiriendo
            ? "Proponer la corrección"
            : editando
              ? "Guardar cambios"
              : "Proponer el torneo"}
      </button>
    </form>
  );
}
