"use client";

import Link from "next/link";

import { useActionState } from "react";

import { moderarTorneo } from "@/acciones/torneos";
import { interpretarContacto, nombreOrganizador, rangoDeFechas } from "@/lib/torneos";

export type TorneoPendiente = {
  id: string;
  propuesto_por: string | null;
  nombre: string;
  federacion: string | null;
  salas: { nombre: string } | null;
  contacto_inscripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cierre_inscripcion: string | null;
  lugar: string | null;
  notas: string | null;
};

export function FilaTorneoPendiente({
  torneo: t,
  quien,
}: {
  torneo: TorneoPendiente;
  quien?: { id: string; etiqueta: string } | null;
}) {
  const [estado, accion, guardando] = useActionState(moderarTorneo, {});
  const contacto = interpretarContacto(t.contacto_inscripcion);

  return (
    <li className="rounded-xl border border-borde bg-fondo-elevado p-3">
      <p className="text-xs text-texto-suave">
        {nombreOrganizador(t.federacion, t.salas?.nombre)}
        {t.fecha_inicio
          ? ` · ${rangoDeFechas(t.fecha_inicio, t.fecha_fin)}`
          : " · sin fecha"}
        {quien && (
          <>
            {" · propuesto por "}
            <Link href={`/admin/usuarios/${quien.id}`} className="text-acento underline">
              {quien.etiqueta}
            </Link>
          </>
        )}
      </p>
      <p className="font-medium">{t.nombre}</p>
      {t.lugar && <p className="text-sm text-texto-suave">{t.lugar}</p>}
      {t.cierre_inscripcion && (
        <p className="text-sm text-texto-suave">
          Cierre de inscripción: {t.cierre_inscripcion}
        </p>
      )}
      {t.notas && <p className="text-sm italic text-texto-suave mt-1">“{t.notas}”</p>}
      {t.contacto_inscripcion && (
        <p className="text-sm text-texto-suave">
          Inscripción: {t.contacto_inscripcion}
          {contacto ? ` (${contacto.tipo})` : " — no se reconoce como link, mail ni teléfono"}
        </p>
      )}

      {estado?.error && <p className="text-sm text-alerta mt-1">{estado.error}</p>}

      <div className="mt-3 flex gap-2">
        {(["aprobado", "rechazado"] as const).map((decision) => (
          <form key={decision} action={accion}>
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="decision" value={decision} />
            <button
              type="submit"
              disabled={guardando}
              className={`rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 ${
                decision === "aprobado"
                  ? "border-precio text-precio hover:bg-precio/10"
                  : "border-borde text-texto-suave hover:border-alerta hover:text-alerta"
              }`}
            >
              {decision === "aprobado" ? "Aprobar" : "Rechazar"}
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}
