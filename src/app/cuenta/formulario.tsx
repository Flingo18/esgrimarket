"use client";

import { useActionState } from "react";

import { guardarPerfil } from "@/acciones/perfil";

const CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2.5 " +
  "outline-none focus:border-acento";

type Sala = { id: string; nombre: string; barrio: string | null };

export function FormularioPerfil({
  nombre,
  telefono,
  salaId,
  salas,
}: {
  nombre: string;
  telefono: string;
  salaId: string;
  salas: Sala[];
}) {
  const [estado, accion, guardando] = useActionState(guardarPerfil, {});

  return (
    <form action={accion} className="space-y-5">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium mb-1.5">
          Tu nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          defaultValue={nombre}
          maxLength={60}
          placeholder="Como te conocen en la sala"
          className={CAMPO}
        />
      </div>

      <div>
        <label htmlFor="telefono" className="block text-sm font-medium mb-1.5">
          Tu WhatsApp
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          defaultValue={telefono}
          placeholder="11 1234-5678"
          className={CAMPO}
        />
        <p className="text-xs text-texto-suave mt-1">
          Se carga una sola vez y se usa en todas tus publicaciones. Nunca se
          muestra en la página: aparece detrás de un botón. Escribilo sin el 0
          y sin el 15.
        </p>
      </div>

      {salas.length > 0 && (
        <div>
          <label htmlFor="sala_id" className="block text-sm font-medium mb-1.5">
            Tu sala
          </label>
          <select id="sala_id" name="sala_id" defaultValue={salaId} className={CAMPO}>
            <option value="">Sin especificar</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.barrio ? ` — ${s.barrio}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {estado.error && <p className="text-sm text-alerta">{estado.error}</p>}
      {estado.ok && <p className="text-sm text-precio">Guardado.</p>}

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-acento text-acento-texto font-medium px-5 py-2.5 hover:opacity-90 disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
