import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioSala } from "./formulario";

export const metadata: Metadata = { title: "Proponer una sala" };

export default async function PaginaProponerSala() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  // Las propias las ve aunque estén pendientes, para saber que no se perdieron.
  const { data: propias } = await supabase
    .from("salas")
    .select("id, nombre, situacion")
    .eq("propuesta_por", user.id)
    .order("creado_en", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Proponer una sala</h1>
      <p className="mt-1 text-texto-suave">
        ¿Falta tu club en el mapa? Cargalo acá. Lo revisamos antes de publicarlo,
        para que no aparezcan direcciones equivocadas.
      </p>

      {propias && propias.length > 0 && (
        <ul className="mt-6 space-y-2">
          {propias.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-borde bg-fondo-elevado px-3 py-2 text-sm flex justify-between gap-3"
            >
              <span>{s.nombre}</span>
              <span className="text-texto-suave shrink-0">
                {s.situacion === "pendiente"
                  ? "Esperando aprobación"
                  : s.situacion === "aprobada"
                    ? "Publicada"
                    : "No aprobada"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <FormularioSala />
      </div>

      <p className="mt-8 text-sm text-texto-suave">
        <Link href="/mapa" className="text-acento underline">
          Volver al mapa
        </Link>
      </p>
    </div>
  );
}
