import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioBusqueda, ListaBusquedas } from "./cliente";

export const metadata: Metadata = { title: "Lo que estoy buscando" };

export default async function PaginaBusquedas() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: busquedas } = await supabase
    .from("busquedas")
    .select("id, texto, categoria, tipo, arma, mano, talle, precio_max, moneda, avisos")
    .order("creado_en", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Lo que estoy buscando
      </h1>
      <p className="mt-1 text-texto-suave">
        Guardá lo que necesitás y te avisamos por mail a {user.email} apenas
        alguien lo publique. Podés guardar todas las búsquedas que quieras.
      </p>

      {busquedas && busquedas.length > 0 && (
        <ListaBusquedas busquedas={busquedas} />
      )}

      <div className="mt-8 rounded-xl border border-borde bg-fondo-elevado p-4">
        <h2 className="font-medium mb-4">Agregar una búsqueda</h2>
        <FormularioBusqueda />
      </div>
    </div>
  );
}
