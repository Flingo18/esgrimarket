import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioTorneo } from "./formulario";

export const metadata: Metadata = { title: "Agregar un torneo" };

export default async function PaginaProponerTorneo() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: propios } = await supabase
    .from("torneos")
    .select("id, nombre, situacion")
    .eq("propuesto_por", user.id)
    .eq("situacion", "pendiente")
    .order("creado_en", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Agregar un torneo</h1>
      <p className="mt-1 text-texto-suave">
        ¿Falta una fecha en el calendario? Cargala acá. La revisamos antes de
        publicarla, para que no queden fechas equivocadas dando vueltas.
      </p>

      {propios && propios.length > 0 && (
        <ul className="mt-6 space-y-2">
          {propios.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-borde bg-fondo-elevado px-3 py-2 text-sm flex justify-between gap-3"
            >
              <span>{t.nombre}</span>
              <span className="text-texto-suave shrink-0">Esperando aprobación</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <FormularioTorneo />
      </div>

      <p className="mt-8 text-sm text-texto-suave">
        <Link href="/torneos" className="text-acento underline">
          Volver al calendario
        </Link>
      </p>
    </div>
  );
}
