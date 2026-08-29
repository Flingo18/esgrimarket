import type { Metadata } from "next";
import Link from "next/link";

import {
  CalendarioTorneos,
  type TorneoCalendario,
} from "@/components/calendario-torneos";
import { ListaTorneos } from "@/components/lista-torneos";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FEDERACIONES, claveMes, mesDe } from "@/lib/torneos";

export const metadata: Metadata = {
  title: "Calendario de torneos",
  description:
    "Todos los torneos de esgrima de Argentina, con fechas de cierre de inscripción y dónde anotarse.",
};

const COLUMNAS =
  "id, nombre, federacion, organizador_tipo, sala_id, salas(nombre), fecha_inicio, fecha_fin, cierre_inscripcion, lugar, contacto_inscripcion, notas, actualizado_en";

const SELECT =
  "rounded-lg border border-borde bg-fondo-elevado px-2.5 py-2 text-sm outline-none focus:border-acento";

export default async function PaginaTorneos({ searchParams }: PageProps<"/torneos">) {
  const params = await searchParams;
  const federacion = typeof params.federacion === "string" ? params.federacion : "";
  const verPasados = params.pasados === "1";
  const vista = params.vista === "calendario" ? "calendario" : "lista";

  const supabase = await crearClienteServidor();

  let q = supabase
    .from("torneos")
    .select(COLUMNAS)
    .order("fecha_inicio", { ascending: true, nullsFirst: false });

  if (federacion) q = q.eq("federacion", federacion);

  // Las federaciones del filtro salen de los datos, no de una lista fija: así
  // agregar una es cargar un torneo y nada más.
  const { data } = await q;
  const todos = data ?? [];

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

  const conFiltro = (extra: string) =>
    `/torneos?${[federacion && `federacion=${encodeURIComponent(federacion)}`, extra]
      .filter(Boolean)
      .join("&")}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendario de torneos</h1>
        <Link href="/torneos/proponer" className="text-sm text-acento underline">
          Agregar un torneo
        </Link>
      </div>
      <p className="mt-1 text-texto-suave">
        Fechas de todas las federaciones, con el cierre de inscripción y dónde
        anotarse.
      </p>

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
          <CalendarioTorneos torneos={conFecha as TorneoCalendario[]} />
        </div>
      ) : (
        <>
          {aMostrar.length === 0 && sinFecha.length === 0 && (
            <p className="mt-12 text-center text-texto-suave">
              No hay torneos cargados con esos filtros.
            </p>
          )}

          {[...porMes.entries()].map(([k, torneos]) => (
            <section key={k} className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
                {mesDe(torneos[0].fecha_inicio!)}
              </h2>
              <ListaTorneos torneos={torneos} />
            </section>
          ))}

          {!verPasados && sinFecha.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
                Fecha por confirmar
              </h2>
              <ListaTorneos torneos={sinFecha} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
