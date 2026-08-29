import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioPublicar } from "./formulario";

export const metadata: Metadata = { title: "Publicar" };

export default async function PaginaPublicar() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  // El teléfono se pide una sola vez: si ya está, el formulario lo muestra
  // cargado y la persona no lo vuelve a escribir en cada publicación.
  const [{ data: perfil }, { data: salas }, { count: activas }, { data: puedeStock }] =
    await Promise.all([
    supabase
      .from("perfiles")
      .select("telefono_visible, limite_publicaciones, zonas_entrega, barrio")
      .eq("id", user.id)
      .single(),
    supabase.from("salas").select("id, nombre, barrio").order("nombre"),
    supabase
      .from("publicaciones")
      .select("id", { count: "exact", head: true })
      .eq("autor_id", user.id)
      .eq("situacion", "activa"),
    // Lo decide la base, no la interfaz: acá sólo se pregunta para saber si
    // mostrar el campo.
    supabase.rpc("puede_cargar_stock"),
  ]);

  const limite = perfil?.limite_publicaciones ?? 5;
  const usadas = activas ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Publicar</h1>
      <p className="mt-1 text-texto-suave">
        Tenés {usadas} de {limite} publicaciones activas.
        {usadas >= limite &&
          " Marcá alguna como vendida para liberar lugar."}
      </p>

      <div className="mt-8">
        <FormularioPublicar
          telefonoGuardado={perfil?.telefono_visible ?? ""}
          salas={salas ?? []}
          puedeCargarStock={puedeStock ?? false}
          zonasDelPerfil={perfil?.zonas_entrega ?? []}
        />
      </div>
    </div>
  );
}
