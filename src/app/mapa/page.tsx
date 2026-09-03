import type { Metadata } from "next";
import Link from "next/link";

import { ComoFunciona } from "@/components/como-funciona";
import { MapaCargador } from "@/components/mapa-cargador";
import type { SalaMapa, ZonaMapa } from "@/components/mapa";
import {
  CATEGORIAS,
  TIPOS_POR_CATEGORIA,
  type Categoria,
} from "@/lib/taxonomy";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mapa de salas",
  description:
    "Dónde se practica esgrima en Argentina, y dónde se puede retirar lo que está publicado.",
};

export default async function PaginaMapa({
  searchParams,
}: PageProps<"/mapa">) {
  const params = await searchParams;
  const ver = params.ver === "productos" ? "productos" : "salas";
  // El valor viene como "categoria" o "categoria:tipo": un solo control da
  // las dos granularidades sin dos desplegables que dependan entre sí.
  const que = typeof params.que === "string" ? params.que : "";
  const [catCruda, tipoCrudo = ""] = que.split(":");
  const categoria = catCruda in CATEGORIAS ? (catCruda as Categoria) : null;
  const tipo =
    categoria && tipoCrudo in TIPOS_POR_CATEGORIA[categoria] ? tipoCrudo : "";

  const supabase = await crearClienteServidor();

  const [{ data: salas }, { data: publicaciones }] = await Promise.all([
    supabase
      .from("salas")
      .select("id, nombre, direccion, barrio, telefono, lat, lng")
      .eq("activa", true)
      .order("nombre"),
    // La RLS ya limita a lo activo, no vencido y con foto.
    (() => {
      let q = supabase
        .from("publicaciones")
        .select("id, titulo, categoria, tipo, lat_aprox, lng_aprox")
        .not("lat_aprox", "is", null);
      if (categoria) q = q.eq("categoria", categoria);
      if (tipo) q = q.eq("tipo", tipo);
      return q.order("creado_en", { ascending: false });
    })(),
  ]);

  // Una sala sin coordenada se lista abajo pero no se dibuja: poner una
  // chinche en el centro del partido mandaría gente a un lugar equivocado.
  const conMapa: SalaMapa[] = (salas ?? [])
    .filter((s): s is SalaMapa => s.lat !== null && s.lng !== null)
    .map((s) => ({ ...s }));

  const zonas: ZonaMapa[] = (publicaciones ?? [])
    .filter((p) => p.lat_aprox !== null && p.lng_aprox !== null)
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      lat: p.lat_aprox as number,
      lng: p.lng_aprox as number,
    }));

  // Las correcciones pendientes de cada sala, en una consulta y no una por
  // fila. Las salas no tienen ficha propia como los torneos, así que acá se
  // marca y se vota en /correcciones.
  const admin = crearClienteAdmin();
  const { data: pendientes } = await admin
    .from("correcciones")
    .select("fila_id")
    .eq("tabla", "salas")
    .eq("situacion", "pendiente");

  const correccionesPorSala = new Map<string, number>();
  for (const c of pendientes ?? []) {
    correccionesPorSala.set(c.fila_id, (correccionesPorSala.get(c.fila_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Mapa</h1>
      <p className="mt-1 text-texto-suave">
        Las salas de esgrima del país
        {zonas.length > 0 && ", y las zonas donde se puede retirar lo publicado"}.
      </p>

      <div className="mt-4">
        <ComoFunciona />
      </div>

      {/* Una capa a la vez: con las salas y todas las zonas de entrega
          juntas, el mapa se vuelve ilegible en cuanto haya volumen. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-borde overflow-hidden">
          {(
            [
              ["salas", `Salas (${conMapa.length})`],
              ["productos", "Productos"],
            ] as const
          ).map(([v, etiqueta]) => (
            <Link
              key={v}
              href={v === "salas" ? "/mapa" : `/mapa?ver=productos${que ? `&que=${encodeURIComponent(que)}` : ""}`}
              className={`px-4 py-2 text-sm ${
                ver === v
                  ? "bg-acento text-acento-texto font-medium"
                  : "text-texto-suave hover:text-texto"
              }`}
            >
              {etiqueta}
            </Link>
          ))}
        </div>

        {ver === "productos" && (
          <form className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="ver" value="productos" />
            <select
              name="que"
              defaultValue={que}
              className="rounded-lg border border-borde bg-fondo-elevado px-2.5 py-2 text-sm outline-none focus:border-acento"
            >
              <option value="">Todos los productos</option>
              {(Object.keys(CATEGORIAS) as Categoria[]).map((cat) => (
                <optgroup key={cat} label={CATEGORIAS[cat]}>
                  <option value={cat}>Todo de {CATEGORIAS[cat].toLowerCase()}</option>
                  {Object.entries(TIPOS_POR_CATEGORIA[cat]).map(([t, meta]) => (
                    <option key={`${cat}:${t}`} value={`${cat}:${t}`}>
                      {meta.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-2 hover:opacity-90"
            >
              Filtrar
            </button>
          </form>
        )}
      </div>

      <div className="mt-4">
        <MapaCargador
          salas={ver === "salas" ? conMapa : []}
          zonas={ver === "productos" ? zonas : []}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-texto-suave">
        {ver === "salas" ? (
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-acento" />
            Salas de esgrima
          </span>
        ) : (
          <>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full border-2 border-precio" />
              Zona de entrega, aproximada a 500 m
            </span>
            <span>
              {zonas.length === 0
                ? "Ninguna publicación con esos filtros tiene zona en el mapa."
                : `${zonas.length} ${zonas.length === 1 ? "publicación" : "publicaciones"}`}
            </span>
          </>
        )}
      </div>

      {ver === "salas" ? (
        <>
        {/* El acceso va ANTES de la lista y como botón, no como renglón al pie:
            tres personas pidieron que les agregaran su sala sin haber visto el
            enlace que estaba abajo de todo. */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Salas</h2>
          <Link
            href="/salas/proponer"
            className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-2 hover:opacity-90"
          >
            + Agregar mi sala
          </Link>
        </div>
        <p className="mt-1 text-sm text-texto-suave">
          ¿Falta tu club? Cargalo vos: lo revisamos y lo publicamos.
        </p>
        <ul className="mt-3 grid sm:grid-cols-2 gap-3">
          {(salas ?? []).map((s) => (
            <li key={s.id} className="rounded-xl border border-borde bg-fondo-elevado p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{s.nombre}</p>
                {(correccionesPorSala.get(s.id) ?? 0) > 0 && (
                  <Link
                    href="/correcciones"
                    className="text-xs rounded-md border border-acento px-1.5 py-0.5 font-medium text-acento"
                  >
                    {correccionesPorSala.get(s.id) === 1
                      ? "1 corrección propuesta"
                      : `${correccionesPorSala.get(s.id)} correcciones`}
                  </Link>
                )}
              </div>
              <p className="text-sm text-texto-suave">
                {s.direccion ? `${s.direccion}, ` : ""}
                {s.barrio}
              </p>
              {s.telefono && (
                <a
                  href={`tel:${s.telefono.replace(/\D/g, "")}`}
                  className="text-sm text-acento"
                >
                  {s.telefono}
                </a>
              )}
              {s.lat === null || s.lng === null ? (
                /* Es justo el caso donde corregir sirve más: agregarle el punto
                   la pone en el mapa. Así que acá el enlace no es al pasar, es
                   el pedido. */
                <p className="text-xs mt-1">
                  <span className="text-texto-suave">
                    Todavía sin dirección exacta, por eso no está en el mapa.
                  </span>{" "}
                  <Link
                    href={`/salas/${s.id}/corregir`}
                    className="text-acento underline"
                  >
                    ¿Sabés dónde queda? Agregalo
                  </Link>
                </p>
              ) : (
                <p className="mt-2 flex flex-wrap gap-x-4 text-xs">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-acento underline font-medium"
                  >
                    Cómo llegar
                  </a>
                  <Link
                    href={`/salas/${s.id}/corregir`}
                    className="text-texto-suave underline hover:text-texto"
                  >
                    ¿Falta un dato o está mal?
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
        </>
      ) : (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">
            {zonas.length === 0
              ? "Sin publicaciones para mostrar"
              : `${zonas.length} ${zonas.length === 1 ? "publicación" : "publicaciones"} en el mapa`}
          </h2>
          <p className="mt-1 text-sm text-texto-suave">
            El círculo es la zona aproximada de entrega, no el domicilio de
            nadie: el punto viene corrido al azar a 500 metros.
          </p>

          {zonas.length === 0 ? (
            <p className="mt-4 text-sm text-texto-suave">
              Puede ser por el filtro, o porque las publicaciones de ese tipo
              no cargaron zona de entrega.{" "}
              <Link href="/mapa?ver=productos" className="text-acento underline">
                Ver todas
              </Link>
            </p>
          ) : (
            <ul className="mt-3 grid sm:grid-cols-2 gap-3">
              {(publicaciones ?? []).map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-borde bg-fondo-elevado p-3"
                >
                  <Link href={`/p/${p.id}`} className="font-medium hover:text-acento">
                    {p.titulo}
                  </Link>
                  <p className="text-sm text-texto-suave">
                    {TIPOS_POR_CATEGORIA[p.categoria as Categoria]?.[p.tipo]?.label ??
                      CATEGORIAS[p.categoria as Categoria] ??
                      p.categoria}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

    </div>
  );
}
