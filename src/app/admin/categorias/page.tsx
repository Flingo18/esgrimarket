import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { borrarCategoria } from "@/acciones/categorias";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  FEDERACIONES,
  categoriasPorFederacion,
  type Categoria,
} from "@/lib/torneos";

import { EditorCategoria } from "./cliente";

export const metadata: Metadata = { title: "Categorías" };

export default async function PaginaCategorias({
  searchParams,
}: PageProps<"/admin/categorias">) {
  const { guardada, borrada, en_uso } = await searchParams;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) notFound();

  const admin = crearClienteAdmin();
  const [{ data: categorias }, { data: usos }] = await Promise.all([
    admin
      .from("categorias")
      .select("id, federacion, nombre, edad_desde, edad_hasta, activa")
      .order("edad_desde", { nullsFirst: false })
      .order("edad_hasta", { nullsFirst: false })
      .order("nombre"),
    admin.from("torneos_categorias").select("categoria_id"),
  ]);

  const enUso = new Map<string, number>();
  for (const u of usos ?? []) {
    enUso.set(u.categoria_id, (enUso.get(u.categoria_id) ?? 0) + 1);
  }

  const grupos = categoriasPorFederacion((categorias ?? []) as Categoria[]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
      <p className="mt-1 text-sm text-texto-suave">
        <Link href="/admin" className="text-acento underline">
          Volver al panel
        </Link>
      </p>
      <p className="mt-3 text-sm text-texto-suave">
        Cada federación tiene las suyas y no coinciden entre sí. Son la lista
        contra la que se cargan los torneos, así que las edita sólo el admin:
        si cambiaran solas cambiaría el significado de todo lo ya cargado.
      </p>

      {guardada && (
        <p className="mt-4 rounded-lg border border-precio/40 bg-precio/10 px-3 py-2 text-sm text-precio">
          Categoría guardada.
        </p>
      )}
      {borrada && (
        <p className="mt-4 rounded-lg border border-precio/40 bg-precio/10 px-3 py-2 text-sm text-precio">
          Categoría borrada.
        </p>
      )}
      {en_uso && (
        <p className="mt-4 rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          No la borré: hay {en_uso} {Number(en_uso) === 1 ? "torneo" : "torneos"}{" "}
          usándola y se les borraría la categoría sin dejar rastro. Si ya no va
          más, destildá “se ofrece al cargar un torneo”.
        </p>
      )}

      {grupos.map(([federacion, deLaFederacion]) => (
        <section key={federacion} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
            {FEDERACIONES[federacion as keyof typeof FEDERACIONES] ?? federacion}
          </h2>
          <ul className="mt-3 space-y-2">
            {deLaFederacion.map((c) => (
              <div key={c.id}>
                <EditorCategoria categoria={c as Categoria & { activa: boolean }} />
                {!enUso.get(c.id) && (
                  <form action={borrarCategoria} className="mt-1 pl-3">
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="text-xs text-texto-suave hover:text-alerta underline"
                    >
                      Borrarla
                    </button>
                  </form>
                )}
              </div>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
          Agregar una
        </h2>
        <ul className="mt-3">
          <EditorCategoria />
        </ul>
      </section>
    </div>
  );
}
