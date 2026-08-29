import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";
import {
  FormularioPublicar,
  type PublicacionEditable,
} from "@/app/publicar/formulario";

export const metadata: Metadata = { title: "Editar publicación" };

export default async function PaginaEditar({ params }: PageProps<"/p/[id]/editar">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const [{ data: p }, { data: perfil }, { data: salas }] = await Promise.all([
    supabase
      .from("publicaciones")
      .select(
        "id, autor_id, titulo, descripcion, categoria, tipo, armas_compatibles, es_electrica, empunadura, talle, nivel_proteccion, mano, marca, anio, estado, moneda_base, monto, unidades, zona, barrio, sala_entrega_id, fotos(path, orden)",
      )
      .eq("id", id)
      .single(),
    supabase.from("perfiles").select("telefono_visible").eq("id", user.id).single(),
    supabase.from("salas").select("id, nombre, barrio").order("nombre"),
  ]);

  const { data: puedeStock } = await supabase.rpc("puede_cargar_stock");

  if (!p) notFound();

  // La RLS ya impediría el update, pero conviene no mostrar siquiera el
  // formulario cargado con datos ajenos.
  if (p.autor_id !== user.id) notFound();

  const inicial: PublicacionEditable = {
    id: p.id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    categoria: p.categoria,
    tipo: p.tipo,
    armas_compatibles: p.armas_compatibles,
    es_electrica: p.es_electrica,
    empunadura: p.empunadura,
    talle: p.talle,
    nivel_proteccion: p.nivel_proteccion,
    mano: p.mano,
    marca: p.marca,
    anio: p.anio,
    estado: p.estado,
    moneda_base: p.moneda_base,
    monto: p.monto,
    unidades: p.unidades,
    zona: p.zona,
    barrio: p.barrio,
    sala_entrega_id: p.sala_entrega_id,
    fotos: [...p.fotos].sort((a, b) => a.orden - b.orden).map((f) => f.path),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Editar publicación</h1>
      <p className="mt-1 text-texto-suave">
        <Link href="/mis-publicaciones" className="text-acento underline">
          Volver a mis publicaciones
        </Link>
      </p>

      <div className="mt-8">
        <FormularioPublicar
          telefonoGuardado={perfil?.telefono_visible ?? ""}
          salas={salas ?? []}
          inicial={inicial}
          puedeCargarStock={puedeStock ?? false}
        />
      </div>
    </div>
  );
}
