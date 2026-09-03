import type { Metadata } from "next";
import Link from "next/link";

import { ComoFunciona } from "@/components/como-funciona";
import { MapaCargador } from "@/components/mapa-cargador";
import type { SalaMapa, ZonaMapa } from "@/components/mapa";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mapa de salas",
  description:
    "Dónde se practica esgrima en Argentina, y dónde se puede retirar lo que está publicado.",
};

export default async function PaginaMapa() {
  const supabase = await crearClienteServidor();

  const [{ data: salas }, { data: publicaciones }] = await Promise.all([
    supabase
      .from("salas")
      .select("id, nombre, direccion, barrio, telefono, lat, lng")
      .eq("activa", true)
      .order("nombre"),
    // La RLS ya limita a lo activo y no vencido.
    supabase
      .from("publicaciones")
      .select("id, titulo, lat_aprox, lng_aprox")
      .not("lat_aprox", "is", null),
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

      <div className="mt-6">
        <MapaCargador salas={conMapa} zonas={zonas} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-texto-suave">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-acento" />
          Salas de esgrima
        </span>
        {zonas.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full border-2 border-precio" />
            Zona de entrega, aproximada a 500 m
          </span>
        )}
      </div>

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
              <p className="text-xs mt-2">
                <Link
                  href={`/salas/${s.id}/corregir`}
                  className="text-acento underline"
                >
                  ¿Falta un dato o está mal? Corregilo
                </Link>
              </p>
            )}
          </li>
        ))}
      </ul>

    </div>
  );
}
