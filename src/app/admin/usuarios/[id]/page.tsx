import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import { paisDeE164 } from "@/lib/whatsapp";
import { ROLES } from "@/lib/roles";
import { urlFoto } from "@/lib/publicaciones";
import { etiquetaZonas } from "@/lib/geo";

import { AccionesCuenta, BajarPublicacion } from "./cliente";

export const metadata: Metadata = { title: "Cuenta" };

const SITUACIONES: Record<string, string> = {
  activa: "Activa",
  vendida: "Vendida",
  pausada: "Pausada",
  vencida: "Vencida",
};

export default async function PaginaCuentaAdmin({
  params,
}: PageProps<"/admin/usuarios/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) notFound();

  const admin = crearClienteAdmin();

  const [
    { data: perfil },
    { data: cuenta },
    { data: publicaciones },
    { data: salasPropias },
    { data: torneosPropios },
  ] = await Promise.all([
      admin
        .from("perfiles")
        .select("id, nombre, telefono_visible, telefono_e164, rol, suspendido, motivo_suspension, zonas_entrega, barrio, creado_en")
        .eq("id", id)
        .single(),
      admin.auth.admin.getUserById(id),
      admin
        .from("publicaciones")
        .select("id, titulo, situacion, monto, moneda_base, contactos, unidades, zonas, barrio, creado_en, fotos(path, orden)")
        .eq("autor_id", id)
        .order("creado_en", { ascending: false }),
      admin
        .from("salas")
        .select("id, nombre, barrio, situacion")
        .eq("propuesta_por", id)
        .order("creado_en", { ascending: false }),
      admin
        .from("torneos")
        .select("id, nombre, fecha_inicio, situacion")
        .eq("propuesto_por", id)
        .order("creado_en", { ascending: false }),
    ]);

  if (!perfil) notFound();

  const email = cuenta?.user?.email ?? "(sin mail)";
  const lista = publicaciones ?? [];
  const activas = lista.filter((p) => p.situacion === "activa").length;
  const contactos = lista.reduce((n, p) => n + p.contactos, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm">
        <Link href="/admin" className="text-acento underline">
          ← Volver al panel
        </Link>
      </p>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {perfil.nombre || email}
          </h1>
          <p className="text-texto-suave">{email}</p>
        </div>
        <span className="text-xs rounded-md px-2 py-1 font-medium bg-fondo-sutil text-texto-suave">
          {ROLES[perfil.rol as keyof typeof ROLES] ?? perfil.rol}
        </span>
      </div>

      {perfil.suspendido && (
        <p className="mt-4 rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          Cuenta suspendida. No puede publicar y sus publicaciones no se ven.
          {perfil.motivo_suspension && ` Motivo: ${perfil.motivo_suspension}`}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Publicaciones", lista.length],
          ["Activas", activas],
          ["Consultas recibidas", contactos],
          ["Teléfono", perfil.telefono_visible ?? "—"],
        ].map(([k, v]) => (
          <div
            key={String(k)}
            className="rounded-xl border border-borde bg-fondo-elevado p-3"
          >
            <dd className="text-lg font-semibold truncate">{v}</dd>
            <dt className="text-xs text-texto-suave">{k}</dt>
          </div>
        ))}
      </dl>

      {perfil.zonas_entrega.length > 0 && (
        <p className="mt-3 text-sm text-texto-suave">
          Entrega en {etiquetaZonas(perfil.zonas_entrega, perfil.barrio)}
        </p>
      )}

      <AccionesCuenta
        usuario={perfil.id}
        nombre={perfil.nombre}
        telefono={perfil.telefono_visible ?? ""}
        pais={paisDeE164(perfil.telefono_e164)}
        suspendido={perfil.suspendido}
        esUnoMismo={perfil.id === user.id}
      />

      <h2 className="mt-10 text-lg font-semibold">
        Publicaciones ({lista.length})
      </h2>

      {lista.length === 0 ? (
        <p className="mt-3 text-texto-suave">Esta cuenta no publicó nada.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lista.map((p) => {
            const foto = [...p.fotos].sort((a, b) => a.orden - b.orden)[0];
            return (
              <li
                key={p.id}
                className="rounded-xl border border-borde bg-fondo-elevado p-3 flex gap-3"
              >
                <div className="relative size-16 shrink-0 rounded-lg overflow-hidden bg-fondo-sutil">
                  {foto ? (
                    <Image
                      src={urlFoto(foto.path)}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-[10px] text-texto-suave">
                      Sin foto
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/p/${p.id}`}
                    className="font-medium hover:text-acento line-clamp-1"
                  >
                    {p.titulo}
                  </Link>
                  <p className="text-sm text-texto-suave">
                    {p.moneda_base === "USD" ? "US$" : "$"} {p.monto} ·{" "}
                    {SITUACIONES[p.situacion]} ·{" "}
                    {p.contactos === 0
                      ? "sin consultas"
                      : `${p.contactos} consultas`}
                  </p>
                  <p className="text-xs text-texto-suave">
                    {etiquetaZonas(p.zonas, p.barrio)}
                  </p>
                </div>

                {p.situacion === "activa" && (
                  <BajarPublicacion id={p.id} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Lo que cargó al mapa y al calendario. Es lo que hace que valga la
          pena entrar acá desde un "propuesta por": ver todo lo de esa
          persona junto, no sólo la fila que estabas mirando. */}
      {(salasPropias?.length || torneosPropios?.length) ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Aportes a la comunidad</h2>
          <p className="mt-1 text-sm text-texto-suave">
            Salas y torneos que cargó esta cuenta.
          </p>

          {salasPropias && salasPropias.length > 0 && (
            <ul className="mt-3 space-y-2">
              {salasPropias.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-borde bg-fondo-elevado p-3 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{s.nombre}</p>
                    <p className="text-xs text-texto-suave">
                      Sala{s.barrio ? ` · ${s.barrio}` : ""}
                      {s.situacion !== "aprobada" && ` · ${s.situacion}`}
                    </p>
                  </div>
                  <Link
                    href={`/admin/salas/${s.id}`}
                    className="shrink-0 rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {torneosPropios && torneosPropios.length > 0 && (
            <ul className="mt-2 space-y-2">
              {torneosPropios.map((t) => (
                <li
                  key={t.id}
                  className="rounded-xl border border-borde bg-fondo-elevado p-3 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{t.nombre}</p>
                    <p className="text-xs text-texto-suave">
                      Torneo · {t.fecha_inicio ?? "sin fecha"}
                      {t.situacion !== "aprobado" && ` · ${t.situacion}`}
                    </p>
                  </div>
                  <Link
                    href={`/admin/torneos/${t.id}`}
                    className="shrink-0 rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
