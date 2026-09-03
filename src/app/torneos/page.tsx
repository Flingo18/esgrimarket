import type { Metadata } from "next";
import Link from "next/link";

import {
  CalendarioTorneos,
  type TorneoCalendario,
} from "@/components/calendario-torneos";
import { ListaTorneos } from "@/components/lista-torneos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { correccionesPorTorneo } from "@/lib/correcciones-servidor";
import { ARMAS, TODAS_LAS_ARMAS } from "@/lib/taxonomy";
import {
  FEDERACIONES,
  FEDERACION_CORTA,
  categoriasPorFederacion,
  claveMes,
  mesDe,
  type Categoria,
} from "@/lib/torneos";
import { AvisoTorneos } from "@/components/aviso-torneos";
import { ComoFunciona } from "@/components/como-funciona";

export const metadata: Metadata = {
  title: "Calendario de torneos",
  description:
    "Todos los torneos de esgrima de Argentina, con fechas de cierre de inscripción y dónde anotarse.",
};

/** Para cortar una consulta cuando el filtro no dejó ningún torneo. */
const SIN_RESULTADOS = "00000000-0000-0000-0000-000000000000";

const COLUMNAS =
  "id, nombre, federacion, organizador_tipo, sala_id, salas(nombre), fecha_inicio, fecha_fin, cierre_inscripcion, lugar, contacto_inscripcion, notas, armas, actualizado_en, torneos_categorias(categorias(nombre))";

const SELECT =
  "rounded-lg border border-borde bg-fondo-elevado px-2.5 py-2 text-sm outline-none focus:border-acento";

export default async function PaginaTorneos({ searchParams }: PageProps<"/torneos">) {
  const params = await searchParams;
  const federacion = typeof params.federacion === "string" ? params.federacion : "";
  const categoria = typeof params.categoria === "string" ? params.categoria : "";
  const armaCruda = typeof params.arma === "string" ? params.arma : "";
  const arma = (TODAS_LAS_ARMAS as readonly string[]).includes(armaCruda)
    ? armaCruda
    : "";
  const verPasados = params.pasados === "1";
  const vista = params.vista === "calendario" ? "calendario" : "lista";

  const supabase = await crearClienteServidor();

  const [{ data: categorias }, deLaCategoria] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, federacion, nombre, edad_desde, edad_hasta")
      .eq("activa", true)
      .order("edad_desde", { nullsFirst: false })
      .order("edad_hasta", { nullsFirst: false })
      .order("nombre"),
    // Qué torneos tienen esta categoría, en una consulta aparte.
    //
    // Se podría filtrar con un join embebido, pero PostgREST recorta también
    // las categorías que devuelve: el torneo terminaría mostrando sólo la que
    // se filtró y no las demás en las que compite.
    categoria
      ? supabase
          .from("torneos_categorias")
          .select("torneo_id")
          .eq("categoria_id", categoria)
          .then(({ data }) => (data ?? []).map((f) => f.torneo_id))
      : Promise.resolve(null),
  ]);

  let q = supabase
    .from("torneos")
    .select(COLUMNAS)
    .order("fecha_inicio", { ascending: true, nullsFirst: false });

  if (federacion) q = q.eq("federacion", federacion);
  // `contains` sobre el arreglo: un torneo de florete y espada aparece
  // filtrando por cualquiera de las dos.
  if (arma) q = q.contains("armas", [arma]);
  // Sin torneos en esa categoría el `in` vacío no filtra nada, así que se
  // corta con un id imposible.
  if (deLaCategoria) {
    q = q.in("id", deLaCategoria.length ? deLaCategoria : [SIN_RESULTADOS]);
  }

  // Las federaciones del filtro salen de los datos, no de una lista fija: así
  // agregar una es cargar un torneo y nada más.
  const { data } = await q;

  // El embebido llega como torneos_categorias[].categorias. Se aplana acá y
  // no en la vista: si el componente recibiera la forma cruda, `categorias`
  // quedaría siempre vacío y no fallaría nada — el peor tipo de error.
  const todos = (data ?? []).map(({ torneos_categorias, ...t }) => ({
    ...t,
    categorias: (torneos_categorias ?? [])
      .map((tc) => tc.categorias)
      .filter((c): c is { nombre: string } => c !== null),
  }));

  const hoy = new Date().toISOString().slice(0, 10);
  const sinFecha = todos.filter((t) => !t.fecha_inicio);
  const conFecha = todos.filter((t) => t.fecha_inicio);
  const pasados = conFecha.filter((t) => (t.fecha_fin ?? t.fecha_inicio!) < hoy);
  const proximos = conFecha.filter((t) => (t.fecha_fin ?? t.fecha_inicio!) >= hoy);
  const aMostrar = verPasados ? pasados : proximos;

  const porMes = new Map<string, typeof aMostrar>();
  for (const t of aMostrar) {
    const k = claveMes(t.fecha_inicio!);
    porMes.set(k, [...(porMes.get(k) ?? []), t]);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const correcciones = await correccionesPorTorneo(todos, user?.id ?? null);

  /** El mismo listado con un filtro cambiado, conservando los demás. */
  const conFiltro = (extra: string, cambios?: Record<string, string>) => {
    const url = new URLSearchParams();
    const puestos = { federacion, categoria, arma, ...cambios };
    for (const [k, v] of Object.entries(puestos)) if (v) url.set(k, v);
    for (const par of extra.split("&").filter(Boolean)) {
      const [k, v = ""] = par.split("=");
      url.set(k, decodeURIComponent(v));
    }
    const q = url.toString();
    return q ? `/torneos?${q}` : "/torneos";
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendario de torneos</h1>
        <div className="flex gap-4">
          <Link href="/correcciones" className="text-sm text-acento underline">
            Correcciones
          </Link>
          <Link href="/torneos/proponer" className="text-sm text-acento underline">
            Agregar un torneo
          </Link>
        </div>
      </div>
      <p className="mt-1 text-texto-suave">
        Fechas de todas las federaciones, con el cierre de inscripción y dónde
        anotarse.
      </p>

      <div className="mt-4">
        <ComoFunciona compacto />
      </div>

      <AvisoTorneos />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-borde overflow-hidden">
          {(["lista", "calendario"] as const).map((v) => (
            <Link
              key={v}
              href={conFiltro(`vista=${v}`)}
              className={`px-4 py-2 text-sm ${
                vista === v
                  ? "bg-acento text-acento-texto font-medium"
                  : "text-texto-suave hover:text-texto"
              }`}
            >
              {v === "lista" ? "Lista" : "Calendario"}
            </Link>
          ))}
        </div>

        <form className="flex flex-wrap gap-2 items-center">
          <input type="hidden" name="vista" value={vista} />
          {verPasados && <input type="hidden" name="pasados" value="1" />}
          <select name="federacion" defaultValue={federacion} className={SELECT}>
            <option value="">Todos los organizadores</option>
            {Object.entries(FEDERACIONES).map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>

          <select name="arma" defaultValue={arma} className={SELECT}>
            <option value="">Todas las armas</option>
            {TODAS_LAS_ARMAS.map((a) => (
              <option key={a} value={a}>{ARMAS[a]}</option>
            ))}
          </select>

          <select name="categoria" defaultValue={categoria} className={SELECT}>
            <option value="">Todas las categorías</option>
            {categoriasPorFederacion((categorias ?? []) as Categoria[]).map(
              ([fed, grupo]) => (
                <optgroup
                  key={fed}
                  label={FEDERACION_CORTA[fed] ?? FEDERACIONES[fed as keyof typeof FEDERACIONES] ?? fed}
                >
                  {grupo.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </optgroup>
              ),
            )}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-2 hover:opacity-90"
          >
            Filtrar
          </button>
        </form>

        {vista === "lista" && (
          <Link
            href={conFiltro(verPasados ? "" : "pasados=1")}
            className="text-sm text-texto-suave underline hover:text-texto"
          >
            {verPasados
              ? "Ver los próximos"
              : `Ver los que ya pasaron (${pasados.length})`}
          </Link>
        )}
      </div>

      {vista === "calendario" ? (
        <div className="mt-6">
          <CalendarioTorneos
            torneos={conFecha as TorneoCalendario[]}
            correcciones={correcciones}
          />
        </div>
      ) : (
        <>
          {aMostrar.length === 0 && sinFecha.length === 0 && (
            <p className="mt-12 text-center text-texto-suave">
              No hay torneos cargados con esos filtros.
              {arma && (
                <>
                  {" "}Ojo: los torneos que todavía no tienen el arma cargada no
                  aparecen al filtrar.
                </>
              )}
              {categoria && (
                <>
                  {" "}
                  <Link
                    href={conFiltro(`vista=${vista}`, { categoria: "" })}
                    className="text-acento underline"
                  >
                    Ver todas las categorías
                  </Link>
                </>
              )}
            </p>
          )}

          {[...porMes.entries()].map(([k, torneos]) => (
            <section key={k} className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
                {mesDe(torneos[0].fecha_inicio!)}
              </h2>
              <ListaTorneos torneos={torneos} correcciones={correcciones} />
            </section>
          ))}

          {!verPasados && sinFecha.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
                Fecha por confirmar
              </h2>
              <ListaTorneos torneos={sinFecha} correcciones={correcciones} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
