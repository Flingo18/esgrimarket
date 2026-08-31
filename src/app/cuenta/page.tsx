import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ROLES } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";
import { paisDeE164 } from "@/lib/whatsapp";

import { BorrarCuenta } from "@/components/borrar-cuenta";

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
      .select("nombre, telefono_visible, telefono_e164, sala_id, rol, rol_hasta, zonas_entrega, barrio")
      .eq("id", user.id)
      .single(),
    supabase.from("salas").select("id, nombre, barrio").order("nombre"),
    supabase
      .from("publicaciones")
      .select("id", { count: "exact", head: true })
      .eq("autor_id", user.id)
      .eq("situacion", "activa"),
  ]);

  const { data: limiteCupo } = await supabase.rpc("limite_efectivo", {
    usuario: user.id,
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
      <p className="mt-1 text-texto-suave">{user.email}</p>

      <div className="mt-6 rounded-xl border border-borde bg-fondo-elevado p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-texto-suave">Publicaciones activas</span>
          <span className="font-medium">
            {activas ?? 0} de {limiteCupo ?? 5}
          </span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-texto-suave">Tipo de cuenta</span>
          <span className="font-medium">
            {ROLES[perfil?.rol as keyof typeof ROLES] ?? "Regular"}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <FormularioPerfil
          nombre={perfil?.nombre ?? ""}
          telefono={perfil?.telefono_visible ?? ""}
          pais={paisDeE164(perfil?.telefono_e164)}
          salaId={perfil?.sala_id ?? ""}
          salas={salas ?? []}
          zonas={perfil?.zonas_entrega ?? []}
          barrio={perfil?.barrio ?? ""}
        />
      </div>

      <p className="mt-8 text-sm text-texto-suave">
        <Link href="/mis-publicaciones" className="text-acento underline">
          Ver mis publicaciones
        </Link>
        {" · "}
        <Link href="/busquedas" className="text-acento underline">
          Lo que estoy buscando
        </Link>
      </p>

      <div className="mt-12 pt-6 border-t border-borde">
        <BorrarCuenta publicaciones={activas ?? 0} />
      </div>
    </div>
  );
}
