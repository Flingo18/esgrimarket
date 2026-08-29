import type { Metadata } from "next";
import Link from "next/link";

import {
  CalendarioTorneos,
  type TorneoCalendario,
} from "@/components/calendario-torneos";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  COLOR_TIPO,
  TIPOS_TORNEO,
  claveMes,
  diasHasta,
  mesDe,
  rangoDeFechas,
} from "@/lib/torneos";

export const metadata: Metadata = {
  title: "Calendario de torneos",
  description:
    "Todos los torneos de esgrima de Argentina: FAE, FECBA e internacionales, con fechas de cierre de inscripción.",
};

const SELECT =
  "rounded-lg border border-borde bg-fondo-elevado px-2.5 py-2 text-sm outline-none focus:border-acento";

export default async function PaginaTorneos({ searchParams }: PageProps<"/torneos">) {
  const params = await searchParams;
  const tipo = typeof params.tipo === "string" ? params.tipo : "";
  const verPasados = params.pasados === "1";
  const vista = params.vista === "calendario" ? "calendario" : "lista";

  const supabase = await crearClienteServidor();
  let q = supabase
    .from("torneos")
    .select("id, nombre, tipo, fecha_inicio, fecha_fin, cierre_inscripcion, lugar, url_inscripcion, notas")
    .order("fecha_inicio", { ascending: true, nullsFirst: false });

  if (tipo && tipo in TIPOS_TORNEO) q = q.eq("tipo", tipo);

  const { data } = await q;
  const todos = data ?? [];

  const hoy = new Date().toISOString().slice(0, 10);
  const sinFecha = todos.filter((t) => !t.fecha_inicio);
  const conFecha = todos.filter((t) => t.fecha_inicio);
  const pasados = conFecha.filter((t) => (t.fecha_fin ?? t.fecha_inicio!) < hoy);
  const proximos = conFecha.filter((t) => (t.fecha_fin ?? t.fecha_inicio!) >= hoy);

  const aMostrar = verPasados ? pasados : proximos;

  // Agrupados por mes: un listado plano de 30 torneos no se lee.
  const porMes = new Map<string, typeof aMostrar>();
  for (const t of aMostrar) {
    const k = claveMes(t.fecha_inicio!);
    porMes.set(k, [...(porMes.get(k) ?? []), t]);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendario de torneos</h1>
        <Link href="/torneos/proponer" className="text-sm text-acento underline">
          Agregar un torneo
        </Link>
      </div>
      <p className="mt-1 text-texto-suave">
        Fechas de la FAE, la FECBA e internacionales, con el cierre de inscripción
        de cada una.
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-borde overflow-hidden">
        {(["lista", "calendario"] as const).map((v) => (
          <Link
            key={v}
            href={`/torneos?vista=${v}${tipo ? `&tipo=${tipo}` : ""}`}
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

      <form className="mt-4 flex flex-wrap gap-2 items-center">
        <select name="tipo" defaultValue={tipo} className={SELECT}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS_TORNEO).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        {verPasados && <input type="hidden" name="pasados" value="1" />}
        {vista === "calendario" && (
          <input type="hidden" name="vista" value="calendario" />
        )}
        <button
          type="submit"
          className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-2 hover:opacity-90"
        >
          Filtrar
        </button>
        {vista === "lista" && (
          <Link
            href={verPasados ? `/torneos${tipo ? `?tipo=${tipo}` : ""}` : `/torneos?pasados=1${tipo ? `&tipo=${tipo}` : ""}`}
            className="text-sm text-texto-suave underline hover:text-texto"
          >
            {verPasados
              ? "Ver los próximos"
              : `Ver los que ya pasaron (${pasados.length})`}
          </Link>
        )}
      </form>

      {vista === "calendario" && (
        <div className="mt-6">
          <CalendarioTorneos torneos={conFecha as TorneoCalendario[]} />
        </div>
      )}

      {vista === "lista" && aMostrar.length === 0 && sinFecha.length === 0 && (
        <p className="mt-12 text-center text-texto-suave">
          No hay torneos cargados con esos filtros.
        </p>
      )}

      {vista === "lista" &&
        [...porMes.entries()].map(([mes, torneos]) => (
          <section key={mes} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
            {mesDe(torneos[0].fecha_inicio!)}
          </h2>

          <ul className="mt-3 space-y-3">
            {torneos.map((t) => {
              const dias = t.cierre_inscripcion ? diasHasta(t.cierre_inscripcion) : null;
              return (
                <li
                  key={t.id}
                  className="rounded-xl border border-borde bg-fondo-elevado p-4"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <span
                      className={`text-xs rounded-md px-2 py-0.5 font-medium ${COLOR_TIPO[t.tipo]}`}
                    >
                      {TIPOS_TORNEO[t.tipo as keyof typeof TIPOS_TORNEO]}
                    </span>
                    <span className="text-sm font-medium">
                      {rangoDeFechas(t.fecha_inicio!, t.fecha_fin)}
                    </span>
                  </div>

                  <h3 className="mt-1.5 font-medium leading-snug">{t.nombre}</h3>

                  {t.lugar && (
                    <p className="text-sm text-texto-suave">{t.lugar}</p>
                  )}

                  {t.cierre_inscripcion && dias !== null && (
                    <p
                      className={`text-sm mt-1 ${
                        dias >= 0 && dias <= 10 ? "text-alerta" : "text-texto-suave"
                      }`}
                    >
                      {dias < 0
                        ? "Inscripción cerrada"
                        : dias === 0
                          ? "La inscripción cierra hoy"
                          : `Cierra la inscripción en ${dias} ${dias === 1 ? "día" : "días"}`}
                    </p>
                  )}

                  {t.notas && (
                    <p className="text-sm text-texto-suave mt-1">{t.notas}</p>
                  )}

                  {t.url_inscripcion && (
                    <a
                      href={t.url_inscripcion}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-sm text-acento underline"
                    >
                      Anotarse
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          </section>
        ))}

      {vista === "lista" && !verPasados && sinFecha.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
            Fecha por confirmar
          </h2>
          <ul className="mt-3 space-y-3">
            {sinFecha.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border border-borde bg-fondo-elevado p-4"
              >
                <span
                  className={`text-xs rounded-md px-2 py-0.5 font-medium ${COLOR_TIPO[t.tipo]}`}
                >
                  {TIPOS_TORNEO[t.tipo as keyof typeof TIPOS_TORNEO]}
                </span>
                <h3 className="mt-1.5 font-medium">{t.nombre}</h3>
                {t.lugar && <p className="text-sm text-texto-suave">{t.lugar}</p>}
                {t.notas && (
                  <p className="text-sm text-texto-suave mt-1">{t.notas}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
