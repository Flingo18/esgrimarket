"use client";

import { useActionState, useState } from "react";

import { guardarPerfil } from "@/acciones/perfil";
import { ZONAS } from "@/lib/geo";
import { SelectorZonas } from "@/components/selector-zonas";
import { CampoTelefono } from "@/components/campo-telefono";
import type { PaisId } from "@/lib/whatsapp";

const CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2.5 " +
  "outline-none focus:border-acento";

type Sala = { id: string; nombre: string; barrio: string | null };

export function FormularioPerfil({
  nombre,
  telefono,
  pais,
  salaId,
  salas,
  zonas: zonasIniciales,
  barrio,
}: {
  nombre: string;
  telefono: string;
  pais: PaisId;
  salaId: string;
  salas: Sala[];
  zonas: string[];
  barrio: string;
}) {
  const [estado, accion, guardando] = useActionState(guardarPerfil, {});
  const [zonas, setZonas] = useState<string[]>(zonasIniciales);

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
        <CampoTelefono
          valorInicial={telefono}
          paisInicial={pais}
          className={CAMPO}
        />
        <p className="text-xs text-texto-suave mt-1">
          Se carga una sola vez y se usa en todas tus publicaciones. Nunca se
          muestra en la página: aparece detrás de un botón.
        </p>
      </div>

      {/*
        Vive en el perfil y no en cada publicación: alguien que entrena en
        zona norte pero vive en Palermo entrega en los dos lados siempre, y
        no tiene por qué repetirlo en cada aviso.
      */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          ¿Dónde entregás habitualmente?
        </label>
        <SelectorZonas
          nombre="zonas_entrega"
          seleccionadas={zonas}
          alCambiar={setZonas}
        />
        <p className="text-xs text-texto-suave mt-1">
          Vienen marcadas de entrada en cada publicación nueva. Después podés
          recortarlas si algo lo entregás en un solo lado.
        </p>
      </div>

      {zonas.includes("caba") && (
        <div>
          <label htmlFor="barrio" className="block text-sm font-medium mb-1.5">
            Tu barrio en CABA
          </label>
          <select id="barrio" name="barrio" defaultValue={barrio} className={CAMPO}>
            <option value="">Sin especificar</option>
            {ZONAS.caba.barrios.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      )}

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
          <a
            href="/salas/proponer"
            className="mt-2 inline-block rounded-lg border border-acento text-acento text-sm px-3 py-1.5 hover:bg-acento-suave"
          >
            + Agregar mi sala
          </a>
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
