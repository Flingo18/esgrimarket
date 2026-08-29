import type { Metadata } from "next";
import Link from "next/link";

import { MapaCargador } from "@/components/mapa-cargador";
import type { SalaMapa, ZonaMapa } from "@/components/mapa";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mapa de salas",
  description:
    "Dónde se practica esgrima en Buenos Aires, y dónde se puede retirar lo que está publicado.",
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Mapa</h1>
      <p className="mt-1 text-texto-suave">
        Las salas de esgrima de Buenos Aires
        {zonas.length > 0 && ", y las zonas donde se puede retirar lo publicado"}.
      </p>

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

      <h2 className="mt-10 text-lg font-semibold">Salas</h2>
      <ul className="mt-3 grid sm:grid-cols-2 gap-3">
        {(salas ?? []).map((s) => (
          <li key={s.id} className="rounded-xl border border-borde bg-fondo-elevado p-3">
            <p className="font-medium">{s.nombre}</p>
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
            {(s.lat === null || s.lng === null) && (
              <p className="text-xs text-texto-suave mt-1">
                Todavía sin dirección exacta, por eso no está en el mapa.
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-texto-suave">
        ¿Falta tu club?{" "}
        <Link href="/salas/proponer" className="text-acento underline">
          Proponelo
        </Link>
        . Lo revisamos antes de publicarlo.
      </p>
    </div>
  );
}
