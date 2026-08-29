import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

import { FilaUsuario } from "./fila";
import { FilaSalaPendiente, type SalaPendiente } from "./salas";

export const metadata: Metadata = { title: "Administración" };

export default async function PaginaAdmin({ searchParams }: PageProps<"/admin">) {
  const { sala: resultadoSala } = await searchParams;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: esAdmin } = await supabase.rpc("es_admin");
  // notFound y no un mensaje de "no tenés permiso": no hace falta confirmarle
  // a nadie que esta página existe.
  if (!esAdmin) notFound();

  // Con la clave de servicio porque los perfiles ajenos no se pueden leer con
  // la sesión propia, y los mails viven en el esquema de autenticación.
  const admin = crearClienteAdmin();

  const [{ data: usuarios }, { data: perfiles }, { count: publicaciones }] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 200 }),
      admin.from("perfiles").select("id, nombre, rol, rol_hasta, telefono_visible"),
      admin.from("publicaciones").select("id", { count: "exact", head: true }),
    ]);

  const { data: todasLasSalas } = await admin
    .from("salas")
    .select("id, nombre, barrio, zona, lat, activa, situacion")
    .eq("situacion", "aprobada")
    .order("nombre");

  const { data: salasPendientes } = await admin
    .from("salas")
    .select("id, nombre, direccion, barrio, zona, telefono, instagram, nota, lat, lng")
    .eq("situacion", "pendiente")
    .order("creado_en", { ascending: true });

  const { data: activasPorAutor } = await admin
    .from("publicaciones")
    .select("autor_id")
    .eq("situacion", "activa");

  const conteo = new Map<string, number>();
  for (const p of activasPorAutor ?? []) {
    conteo.set(p.autor_id, (conteo.get(p.autor_id) ?? 0) + 1);
  }

  const porId = new Map((perfiles ?? []).map((p) => [p.id, p]));

  const filas = (usuarios?.users ?? [])
    .map((u) => {
      const perfil = porId.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "(sin mail)",
        nombre: perfil?.nombre ?? "",
        rol: (perfil?.rol ?? "regular") as "admin" | "pro" | "regular",
        telefono: perfil?.telefono_visible ?? null,
        activas: conteo.get(u.id) ?? 0,
        alta: u.created_at,
      };
    })
    .sort((a, b) => (a.alta < b.alta ? 1 : -1));

  const porRol = (r: string) => filas.filter((f) => f.rol === r).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>

      {typeof resultadoSala === "string" && (
        <p className="mt-4 rounded-lg border border-precio/40 bg-precio/10 px-3 py-2 text-sm text-precio">
          {resultadoSala === "aprobada"
            ? "Sala aprobada. Ya aparece en el mapa."
            : resultadoSala === "guardada"
              ? "Cambios guardados."
              : resultadoSala === "borrada"
                ? "Sala borrada."
                : "Sala rechazada. No se publica."}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Cuentas", filas.length],
          ["Pro", porRol("pro")],
          ["Publicaciones", publicaciones ?? 0],
          ["Activas", activasPorAutor?.length ?? 0],
        ].map(([label, valor]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-borde bg-fondo-elevado p-3"
          >
            <p className="text-2xl font-semibold">{valor}</p>
            <p className="text-sm text-texto-suave">{label}</p>
          </div>
        ))}
      </div>

      {salasPendientes && salasPendientes.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold">
            Salas esperando aprobación ({salasPendientes.length})
          </h2>
          <p className="text-sm text-texto-suave mt-1">
            Propuestas por la comunidad. No aparecen en el mapa hasta que las
            apruebes.
          </p>
          <ul className="mt-4 space-y-2">
            {(salasPendientes as SalaPendiente[]).map((s) => (
              <FilaSalaPendiente key={s.id} sala={s} />
            ))}
          </ul>
        </>
      )}

      <div className="mt-10 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">
          Salas ({todasLasSalas?.length ?? 0})
        </h2>
        <Link href="/salas/proponer" className="text-sm text-acento underline">
          Agregar una
        </Link>
      </div>

      <ul className="mt-3 grid sm:grid-cols-2 gap-2">
        {(todasLasSalas ?? []).map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-borde bg-fondo-elevado p-3 flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{s.nombre}</p>
              <p className="text-xs text-texto-suave">
                {s.barrio ?? "Sin barrio"}
                {!s.lat && " · sin punto en el mapa"}
                {!s.activa && " · oculta"}
              </p>
            </div>
            <Link
              href={`/admin/salas/${s.id}`}
              className="shrink-0 rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento"
            >
              Editar
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">Cuentas</h2>
      <p className="text-sm text-texto-suave mt-1">
        <strong className="text-texto">Pro</strong> puede publicar hasta 200
        artículos y cargar stock. <strong className="text-texto">Regular</strong>{" "}
        publica de a una unidad, hasta 5 activas.
      </p>

      <ul className="mt-4 space-y-2">
        {filas.map((f) => (
          <FilaUsuario key={f.id} usuario={f} esUnoMismo={f.id === user.id} />
        ))}
      </ul>
    </div>
  );
}
