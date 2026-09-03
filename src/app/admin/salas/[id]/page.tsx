import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { borrarSala } from "@/acciones/salas";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  FormularioSala,
  type SalaEditable,
} from "@/app/salas/proponer/formulario";

export const metadata: Metadata = { title: "Editar sala" };


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

export default async function PaginaEditarSala({
  params,
}: PageProps<"/admin/salas/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) notFound();

  const admin = crearClienteAdmin();
  const { data: sala } = await admin
    .from("salas")
    .select("id, nombre, direccion, barrio, zona, telefono, instagram, nota, lat, lng, activa, situacion, propuesta_por")
    .eq("id", id)
    .single();

  if (!sala) notFound();

  const autor = await autorDe(admin, sala.propuesta_por);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Editar sala</h1>
      <p className="mt-1 text-sm text-texto-suave">
        <Link href="/admin" className="text-acento underline">
          Volver al panel
        </Link>
        {autor && (
          <>
            {" · propuesta por "}
            <Link href={`/admin/usuarios/${autor.id}`} className="text-acento underline">
              {autor.etiqueta}
            </Link>
          </>
        )}
        {sala.situacion !== "aprobada" && ` · Estado: ${sala.situacion}`}
      </p>

      <div className="mt-8">
        <FormularioSala esAdmin inicial={sala as SalaEditable} />
      </div>

      <div className="mt-12 pt-6 border-t border-borde">
        <p className="text-sm text-texto-suave mb-3">
          Borrar la sala es definitivo. Si sólo querés sacarla del mapa,
          destildá “Visible en el mapa” arriba: así no se pierde el dato ni se
          rompen las publicaciones que la usaban como punto de entrega.
        </p>
        <form action={borrarSala}>
          <input type="hidden" name="id" value={sala.id} />
          <button
            type="submit"
            className="rounded-lg border border-borde px-3 py-1.5 text-sm text-alerta hover:border-alerta"
          >
            Borrar la sala
          </button>
        </form>
      </div>
    </div>
  );
}
