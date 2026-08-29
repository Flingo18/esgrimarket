import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioPerfil } from "./formulario";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function PaginaCuenta() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const [{ data: perfil }, { data: salas }, { count: activas }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("nombre, telefono_visible, sala_id, limite_publicaciones, es_admin")
      .eq("id", user.id)
      .single(),
    supabase.from("salas").select("id, nombre, barrio").order("nombre"),
    supabase
      .from("publicaciones")
      .select("id", { count: "exact", head: true })
      .eq("autor_id", user.id)
      .eq("situacion", "activa"),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
      <p className="mt-1 text-texto-suave">{user.email}</p>

      <div className="mt-6 rounded-xl border border-borde bg-fondo-elevado p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-texto-suave">Publicaciones activas</span>
          <span className="font-medium">
            {activas ?? 0} de {perfil?.limite_publicaciones ?? 5}
          </span>
        </div>
        {perfil?.es_admin && (
          <div className="flex justify-between mt-2">
            <span className="text-texto-suave">Rol</span>
            <span className="font-medium">Administrador</span>
          </div>
        )}
      </div>

      <div className="mt-8">
        <FormularioPerfil
          nombre={perfil?.nombre ?? ""}
          telefono={perfil?.telefono_visible ?? ""}
          salaId={perfil?.sala_id ?? ""}
          salas={salas ?? []}
        />
      </div>

      <p className="mt-8 text-sm text-texto-suave">
        <Link href="/mis-publicaciones" className="text-acento underline">
          Ver mis publicaciones
        </Link>
      </p>
    </div>
  );
}
