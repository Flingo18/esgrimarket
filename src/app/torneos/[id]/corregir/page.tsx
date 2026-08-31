import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  FormularioTorneo,
  type TorneoEditable,
} from "@/app/torneos/proponer/formulario";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { VOTOS_PARA_APLICAR } from "@/lib/correcciones";

export const metadata: Metadata = { title: "Corregir un torneo" };

export default async function PaginaCorregirTorneo({
  params,
}: PageProps<"/torneos/[id]/corregir">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/ingresar?next=/torneos/${id}/corregir`);

  const admin = crearClienteAdmin();
  const [
    { data: torneo },
    { data: salas },
    { data: categorias },
    { data: elegidas },
    { data: esAdmin },
  ] = await Promise.all([
    admin
      .from("torneos")
      .select("id, nombre, organizador_tipo, federacion, sala_id, fecha_inicio, fecha_fin, cierre_inscripcion, lugar, contacto_inscripcion, notas, propuesto_por, situacion")
      .eq("id", id)
      .single(),
    admin.from("salas").select("id, nombre").eq("situacion", "aprobada").order("nombre"),
    admin
      .from("categorias")
      .select("id, federacion, nombre, edad_desde, edad_hasta")
      .eq("activa", true)
      .order("edad_desde", { nullsFirst: false })
      .order("edad_hasta", { nullsFirst: false })
      .order("nombre"),
    admin.from("torneos_categorias").select("categoria_id").eq("torneo_id", id),
    supabase.rpc("es_admin"),
  ]);

  if (!torneo || torneo.situacion !== "aprobado") notFound();

  const puedeEditar = Boolean(esAdmin) || torneo.propuesto_por === user.id;

  // Si ya hay una corrección esperando avales, conviene decirlo antes de que
  // escriba la misma dos veces.
  const { count: pendientes } = await admin
    .from("correcciones")
    .select("id", { count: "exact", head: true })
    .eq("tabla", "torneos")
    .eq("fila_id", id)
    .eq("situacion", "pendiente");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        {puedeEditar ? "Editar el torneo" : "Corregir el torneo"}
      </h1>

      <p className="mt-2 text-sm text-texto-suave">
        {puedeEditar ? (
          <>Lo cargaste vos, así que los cambios se guardan al instante.</>
        ) : (
          <>
            Cambiá lo que esté mal y mandalo. La corrección se aplica cuando{" "}
            {VOTOS_PARA_APLICAR} personas más digan que está bien, así nadie
            tiene que esperar a que un administrador la mire.
          </>
        )}
      </p>

      {pendientes ? (
        <p className="mt-4 rounded-lg border border-acento/40 bg-acento-suave px-3 py-2 text-sm">
          Ya hay {pendientes === 1 ? "una corrección" : `${pendientes} correcciones`}{" "}
          esperando avales para este torneo.{" "}
          <Link href="/correcciones" className="text-acento underline">
            Miralas antes de escribir otra
          </Link>
          .
        </p>
      ) : null}

      <div className="mt-8">
        <FormularioTorneo
          salas={salas ?? []}
          categorias={categorias ?? []}
          inicial={{
            ...(torneo as TorneoEditable),
            categorias: (elegidas ?? []).map((c) => c.categoria_id),
          }}
          puedeEditar={puedeEditar}
        />
      </div>
    </div>
  );
}
