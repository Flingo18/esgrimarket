import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { borrarTorneo } from "@/acciones/torneos";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { haceCuanto } from "@/lib/torneos";
import {
  FormularioTorneo,
  type TorneoEditable,
} from "@/app/torneos/proponer/formulario";

export const metadata: Metadata = { title: "Editar torneo" };

export default async function PaginaEditarTorneo({
  params,
}: PageProps<"/admin/torneos/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) notFound();

  const admin = crearClienteAdmin();
  const [{ data: torneo }, { data: salas }] = await Promise.all([
    admin
      .from("torneos")
      .select("id, nombre, organizador_tipo, federacion, sala_id, fecha_inicio, fecha_fin, cierre_inscripcion, lugar, contacto_inscripcion, notas, situacion, actualizado_en")
      .eq("id", id)
      .single(),
    admin
      .from("salas")
      .select("id, nombre")
      .eq("situacion", "aprobada")
      .order("nombre"),
  ]);

  if (!torneo) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Editar torneo</h1>
      <p className="mt-1 text-sm text-texto-suave">
        <Link href="/admin" className="text-acento underline">
          Volver al panel
        </Link>
        {" · "}
        Última modificación {haceCuanto(torneo.actualizado_en)}
        {torneo.situacion !== "aprobado" && ` · ${torneo.situacion}`}
      </p>

      <div className="mt-8">
        <FormularioTorneo
          salas={salas ?? []}
          inicial={torneo as TorneoEditable}
        />
      </div>

      <div className="mt-12 pt-6 border-t border-borde">
        <p className="text-sm text-texto-suave mb-3">
          Si el torneo se canceló, conviene aclararlo en las notas antes que
          borrarlo: quien lo tenía anotado va a buscarlo. Borrar es definitivo.
        </p>
        <form action={borrarTorneo}>
          <input type="hidden" name="id" value={torneo.id} />
          <button
            type="submit"
            className="rounded-lg border border-borde px-3 py-1.5 text-sm text-alerta hover:border-alerta"
          >
            Borrar el torneo
          </button>
        </form>
      </div>
    </div>
  );
}
