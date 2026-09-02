import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

import type { Categoria } from "@/lib/torneos";

import { AvisosTorneos } from "./avisos-torneos";
import { FormularioBusqueda, ListaBusquedas } from "./cliente";

export const metadata: Metadata = { title: "Lo que estoy buscando" };

export default async function PaginaBusquedas() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const [{ data: busquedas }, { data: categorias }, { data: aviso }] =
    await Promise.all([
      supabase
        .from("busquedas")
        .select("id, texto, categoria, tipo, arma, mano, talle, precio_max, moneda, avisos")
        .order("creado_en", { ascending: false }),
      supabase
        .from("categorias")
        .select("id, federacion, nombre, edad_desde, edad_hasta")
        .eq("activa", true)
        .order("edad_desde", { nullsFirst: false })
        .order("edad_hasta", { nullsFirst: false })
        .order("nombre"),
      supabase
        .from("avisos_torneos")
        .select("armas, categorias")
        .eq("usuario_id", user.id)
        .maybeSingle(),
    ]);

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

      <AvisosTorneos
        categorias={(categorias ?? []) as Categoria[]}
        actual={aviso ?? null}
      />
    </div>
  );
}
