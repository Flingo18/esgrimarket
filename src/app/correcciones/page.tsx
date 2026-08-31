import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { avalarCorreccion, retirarAval, rechazarCorreccion, retirarCorreccion } from "@/acciones/correcciones";
import {
  VOTOS_PARA_APLICAR,
  etiquetaCampo,
  mostrarValor,
} from "@/lib/correcciones";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { haceCuanto } from "@/lib/torneos";

export const metadata: Metadata = {
  title: "Correcciones",
  description:
    "Cambios propuestos por la comunidad sobre torneos y salas, esperando que alguien más los avale.",
};

type Correccion = {
  id: string;
  tabla: string;
  fila_id: string;
  campos: Record<string, unknown>;
  motivo: string | null;
  propuesta_por: string;
  creado_en: string;
};

export default async function PaginaCorrecciones({
  searchParams,
}: PageProps<"/correcciones">) {
  const { propuesta } = await searchParams;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar?next=/correcciones");

  const admin = crearClienteAdmin();
  const { data: esAdmin } = await supabase.rpc("es_admin");

  const { data: pendientes } = await admin
    .from("correcciones")
    .select("id, tabla, fila_id, campos, motivo, propuesta_por, creado_en")
    .eq("situacion", "pendiente")
    .order("creado_en", { ascending: true });

  const lista = (pendientes ?? []) as Correccion[];

  // Todo lo que hace falta para dibujar el diff, en tres consultas y no en
  // una por corrección.
  const idsTorneo = lista.filter((c) => c.tabla === "torneos").map((c) => c.fila_id);

  const [{ data: torneos }, { data: salas }, { data: votos }, { data: perfiles }] =
    await Promise.all([
      idsTorneo.length
        ? admin
            .from("torneos")
            .select("id, nombre, organizador_tipo, federacion, sala_id, fecha_inicio, fecha_fin, cierre_inscripcion, lugar, contacto_inscripcion, notas")
            .in("id", idsTorneo)
        : Promise.resolve({ data: [] }),
      admin.from("salas").select("id, nombre, direccion, barrio, zona, telefono, instagram, nota, lat, lng"),
      lista.length
        ? admin
            .from("correcciones_votos")
            .select("correccion_id, usuario_id")
            .in("correccion_id", lista.map((c) => c.id))
        : Promise.resolve({ data: [] }),
      admin.from("perfiles").select("id, nombre"),
    ]);

  const filas = new Map<string, Record<string, unknown>>();
  for (const t of torneos ?? []) filas.set(`torneos:${t.id}`, t);
  for (const s of salas ?? []) filas.set(`salas:${s.id}`, s);

  const nombresDeSala = new Map((salas ?? []).map((s) => [s.id, s.nombre]));
  const nombres = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));

  const avales = new Map<string, string[]>();
  for (const v of votos ?? []) {
    avales.set(v.correccion_id, [...(avales.get(v.correccion_id) ?? []), v.usuario_id]);
  }

  const { data: aplicadas } = await admin
    .from("correcciones")
    .select("id, tabla, fila_id, campos, resuelto_en")
    .eq("situacion", "aplicada")
    .order("resuelto_en", { ascending: false })
    .limit(5);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Correcciones</h1>
      <p className="mt-2 text-texto-suave">
        Las fechas se reprograman y las salas se mudan. Cualquiera puede
        proponer un arreglo, y con {VOTOS_PARA_APLICAR} avales se aplica solo
        — sin esperar a nadie.
      </p>

      {propuesta && (
        <p className="mt-5 rounded-lg border border-precio/40 bg-precio/10 px-3 py-2 text-sm text-precio">
          Listo, quedó propuesta. Se aplica cuando la avalen{" "}
          {VOTOS_PARA_APLICAR} personas.
        </p>
      )}

      {lista.length === 0 ? (
        <p className="mt-12 text-center text-texto-suave">
          No hay nada esperando aval. Si ves un dato mal, corregilo desde la
          ficha del torneo o de la sala.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {lista.map((c) => {
            const actual = filas.get(`${c.tabla}:${c.fila_id}`);
            const votantes = avales.get(c.id) ?? [];
            const yaAvale = votantes.includes(user.id);
            const esMia = c.propuesta_por === user.id;
            const faltan = Math.max(0, VOTOS_PARA_APLICAR - votantes.length);
            const quien = nombres.get(c.propuesta_por);
            const destino =
              c.tabla === "torneos" ? "/torneos" : "/mapa";

            return (
              <li
                key={c.id}
                className="rounded-xl border border-borde bg-fondo-elevado p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={destino} className="font-medium hover:text-acento">
                    {(actual?.nombre as string) ?? "Una entrada que ya no existe"}
                  </Link>
                  <span className="text-xs text-texto-suave">
                    {c.tabla === "torneos" ? "Torneo" : "Sala"} ·{" "}
                    {quien ? `propuesta por ${quien}` : "propuesta por alguien de la comunidad"}{" "}
                    {haceCuanto(c.creado_en)}
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5 text-sm">
                  {Object.entries(c.campos).map(([campo, nuevo]) => (
                    <li key={campo} className="flex flex-wrap gap-x-2">
                      <span className="text-texto-suave">{etiquetaCampo(campo)}:</span>
                      <span className="line-through text-texto-suave">
                        {mostrarValor(campo, actual?.[campo], nombresDeSala)}
                      </span>
                      <span aria-hidden>→</span>
                      <span className="font-medium">
                        {mostrarValor(campo, nuevo, nombresDeSala)}
                      </span>
                    </li>
                  ))}
                </ul>

                {c.motivo && (
                  <p className="mt-3 text-sm text-texto-suave italic">“{c.motivo}”</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-texto-suave">
                    {votantes.length} de {VOTOS_PARA_APLICAR} avales
                    {faltan > 0 && ` · faltan ${faltan}`}
                  </span>

                  {esMia ? (
                    <form action={retirarCorreccion}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-alerta hover:text-alerta"
                      >
                        Retirarla
                      </button>
                    </form>
                  ) : yaAvale ? (
                    <form action={retirarAval}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-borde px-3 py-1.5 text-sm text-texto-suave hover:text-texto"
                      >
                        Ya la avalaste — retirar
                      </button>
                    </form>
                  ) : (
                    <form action={avalarCorreccion}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-1.5 hover:opacity-90"
                      >
                        Está bien, que se aplique
                      </button>
                    </form>
                  )}

                  {esAdmin && !esMia && (
                    <form action={rechazarCorreccion}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-borde px-3 py-1.5 text-sm text-alerta hover:border-alerta"
                      >
                        Descartar
                      </button>
                    </form>
                  )}
                </div>

                {esAdmin && !yaAvale && !esMia && (
                  <p className="mt-2 text-xs text-texto-suave">
                    Tu aval la aplica sola, sin esperar a los demás.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {aplicadas && aplicadas.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
            Últimos arreglos
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-texto-suave">
            {aplicadas.map((c) => (
              <li key={c.id}>
                Se corrigió{" "}
                {Object.keys(c.campos as Record<string, unknown>)
                  .map((k) => etiquetaCampo(k).toLowerCase())
                  .join(", ")}{" "}
                en {c.tabla === "torneos" ? "un torneo" : "una sala"} ·{" "}
                {c.resuelto_en && haceCuanto(c.resuelto_en)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
