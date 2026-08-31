import type { Metadata } from "next";
import Link from "next/link";

import {
  CalendarioTorneos,
  type TorneoCalendario,
} from "@/components/calendario-torneos";
import { ListaTorneos } from "@/components/lista-torneos";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  VOTOS_PARA_APLICAR,
  cambiosVisibles,
  type CorreccionConCambios,
} from "@/lib/correcciones";
import { FEDERACIONES, claveMes, mesDe } from "@/lib/torneos";
import { AvisoTorneos } from "@/components/aviso-torneos";

export const metadata: Metadata = {
  title: "Calendario de torneos",
  description:
    "Todos los torneos de esgrima de Argentina, con fechas de cierre de inscripción y dónde anotarse.",
};

const COLUMNAS =
  "id, nombre, federacion, organizador_tipo, sala_id, salas(nombre), fecha_inicio, fecha_fin, cierre_inscripcion, lugar, contacto_inscripcion, notas, actualizado_en, torneos_categorias(categorias(nombre))";

/**
 * Las correcciones que esperan aval, listas para la ficha de cada torneo.
 *
 * Van pegadas al torneo y no sólo en la cola aparte: el que puede decir si
 * una fecha está bien es el que estaba mirando ese torneo, y mandarlo a otra
 * página a buscarla es perderlo.
 */
async function correccionesPorTorneo(
  torneos: { id: string }[],
  usuario: string | null,
): Promise<Map<string, CorreccionConCambios[]>> {
  const porTorneo = new Map<string, CorreccionConCambios[]>();
  if (torneos.length === 0) return porTorneo;

  const admin = crearClienteAdmin();
  const { data: pendientes } = await admin
    .from("correcciones")
    .select("id, fila_id, campos, motivo, propuesta_por")
    .eq("tabla", "torneos")
    .eq("situacion", "pendiente")
    .in("fila_id", torneos.map((t) => t.id));

  if (!pendientes?.length) return porTorneo;

  const [{ data: votos }, { data: salas }] = await Promise.all([
    admin
      .from("correcciones_votos")
      .select("correccion_id, usuario_id")
      .in("correccion_id", pendientes.map((c) => c.id)),
    admin.from("salas").select("id, nombre"),
  ]);

  const nombresDeSala = new Map((salas ?? []).map((s) => [s.id, s.nombre]));
  const porCorreccion = new Map<string, string[]>();
  for (const v of votos ?? []) {
    porCorreccion.set(v.correccion_id, [
      ...(porCorreccion.get(v.correccion_id) ?? []),
      v.usuario_id,
    ]);
  }

  const actuales = new Map(torneos.map((t) => [t.id, t as Record<string, unknown>]));

  for (const c of pendientes) {
    const votantes = porCorreccion.get(c.id) ?? [];
    const esMia = usuario !== null && c.propuesta_por === usuario;
    const yaAvale = usuario !== null && votantes.includes(usuario);

    porTorneo.set(c.fila_id, [
      ...(porTorneo.get(c.fila_id) ?? []),
      {
        id: c.id,
        motivo: c.motivo,
        avales: votantes.length,
        faltan: Math.max(0, VOTOS_PARA_APLICAR - votantes.length),
        esMia,
        yaAvale,
        puedeAvalar: usuario !== null && !esMia && !yaAvale,
        cambios: cambiosVisibles(
          c.campos as Record<string, unknown>,
          actuales.get(c.fila_id),
          nombresDeSala,
        ),
      },
    ]);
  }

  return porTorneo;
}

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

  const conFiltro = (extra: string) =>
    `/torneos?${[federacion && `federacion=${encodeURIComponent(federacion)}`, extra]
      .filter(Boolean)
      .join("&")}`;

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
