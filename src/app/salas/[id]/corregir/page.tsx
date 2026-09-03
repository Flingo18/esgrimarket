import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  FormularioSala,
  type SalaEditable,
} from "@/app/salas/proponer/formulario";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { avalesNecesarios } from "@/lib/correcciones-servidor";

export const metadata: Metadata = { title: "Corregir una sala" };

export default async function PaginaCorregirSala({
  params,
}: PageProps<"/salas/[id]/corregir">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/ingresar?next=/salas/${id}/corregir`);

  const admin = crearClienteAdmin();
  const necesarios = await avalesNecesarios();
  const [{ data: sala }, { data: esAdmin }] = await Promise.all([
    admin
      .from("salas")
      .select("id, nombre, direccion, barrio, zona, telefono, instagram, nota, lat, lng, activa, propuesta_por, situacion")
      .eq("id", id)
      .single(),
    supabase.rpc("es_admin"),
  ]);

  if (!sala || sala.situacion !== "aprobada") notFound();

  const puedeEditar = Boolean(esAdmin) || sala.propuesta_por === user.id;

  const { count: pendientes } = await admin
    .from("correcciones")
    .select("id", { count: "exact", head: true })
    .eq("tabla", "salas")
    .eq("fila_id", id)
    .eq("situacion", "pendiente");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        {puedeEditar ? "Editar la sala" : "Corregir la sala"}
      </h1>

      <p className="mt-2 text-sm text-texto-suave">
        {puedeEditar ? (
          <>La propusiste vos, así que los cambios se guardan al instante.</>
        ) : (
          <>
            Cambiá lo que esté mal y mandalo. Se aplica cuando{" "}
            {necesarios} personas más lo avalen.
          </>
        )}
      </p>

      {pendientes ? (
        <p className="mt-4 rounded-lg border border-acento/40 bg-acento-suave px-3 py-2 text-sm">
          Ya hay {pendientes === 1 ? "una corrección" : `${pendientes} correcciones`}{" "}
          esperando avales para esta sala.{" "}
          <Link href="/correcciones" className="text-acento underline">
            Miralas antes de escribir otra
          </Link>
          .
        </p>
      ) : null}

      <div className="mt-8">
        <FormularioSala
          inicial={sala as SalaEditable}
          puedeEditar={puedeEditar}
          esAdmin={Boolean(esAdmin)}
        />
      </div>
    </div>
  );
}
