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


/** Quién propuso esto, resuelto a algo legible y con enlace a su cuenta. */
async function autorDe(
  admin: ReturnType<typeof crearClienteAdmin>,
  id: string | null,
): Promise<{ id: string; etiqueta: string } | null> {
  if (!id) return null;
  const [{ data: perfil }, { data: cuenta }] = await Promise.all([
    admin.from("perfiles").select("nombre").eq("id", id).maybeSingle(),
    admin.auth.admin.getUserById(id),
  ]);
  return { id, etiqueta: perfil?.nombre?.trim() || cuenta.user?.email || "cuenta borrada" };
}

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
  const [{ data: torneo }, { data: salas }, { data: categorias }, { data: elegidas }] =
    await Promise.all([
    admin
      .from("torneos")
      .select("id, nombre, organizador_tipo, federacion, sala_id, fecha_inicio, fecha_fin, cierre_inscripcion, lugar, contacto_inscripcion, notas, armas, situacion, actualizado_en, propuesto_por")
      .eq("id", id)
      .single(),
    admin
      .from("salas")
      .select("id, nombre")
      .eq("situacion", "aprobada")
      .order("nombre"),
    admin
      .from("categorias")
      .select("id, federacion, nombre, edad_desde, edad_hasta")
      .eq("activa", true)
      .order("edad_desde", { nullsFirst: false })
      .order("edad_hasta", { nullsFirst: false })
      .order("nombre"),
    admin.from("torneos_categorias").select("categoria_id").eq("torneo_id", id),
  ]);

  if (!torneo) notFound();

  const autor = await autorDe(admin, torneo.propuesto_por);

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
        {autor && (
          <>
            {" · propuesto por "}
            <Link href={`/admin/usuarios/${autor.id}`} className="text-acento underline">
              {autor.etiqueta}
            </Link>
          </>
        )}
      </p>

      <div className="mt-8">
        <FormularioTorneo
          salas={salas ?? []}
          categorias={categorias ?? []}
          inicial={{
            ...(torneo as TorneoEditable),
            categorias: (elegidas ?? []).map((c) => c.categoria_id),
          }}
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
