import Link from "next/link";

import { GrillaTorneos } from "./grilla-torneos";
import type { TorneoDetalle } from "./modal-torneo";
import { correccionesPorTorneo } from "@/lib/correcciones-servidor";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Los torneos del próximo mes, arriba del listado de productos.
 *
 * El cierre de inscripción es lo que hace útil esto: alguien entra a mirar
 * una careta usada y de paso se entera de que le quedan cuatro días para
 * anotarse a algo. Si no hay nada próximo, la sección no se dibuja.
 */
export async function TorneosProximos() {
  const supabase = await crearClienteServidor();

  const hoy = new Date();
  const enUnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [{ data }, { data: sesion }] = await Promise.all([
    supabase
      .from("torneos")
      .select("id, nombre, federacion, salas(nombre), fecha_inicio, fecha_fin, lugar, cierre_inscripcion, contacto_inscripcion, notas, armas, actualizado_en, torneos_categorias(categorias(nombre))")
      .gte("fecha_inicio", iso(hoy))
      .lte("fecha_inicio", iso(enUnMes))
      .order("fecha_inicio")
      .limit(4),
    supabase.auth.getUser(),
  ]);

  if (!data?.length) return null;

  // El embebido llega como torneos_categorias[].categorias: se aplana acá,
  // igual que en el calendario.
  const torneos = data.map(({ torneos_categorias, ...t }) => ({
    ...t,
    categorias: (torneos_categorias ?? [])
      .map((tc) => tc.categorias)
      .filter((c): c is { nombre: string } => c !== null),
  }));

  const correcciones = await correccionesPorTorneo(
    torneos,
    sesion.user?.id ?? null,
  );

  return (
    <section className="mt-8 rounded-xl border border-borde bg-fondo-sutil p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Torneos del próximo mes</h2>
        <Link href="/torneos" className="text-sm text-acento underline">
          Ver el calendario completo
        </Link>
      </div>

      <GrillaTorneos
        torneos={torneos as TorneoDetalle[]}
        correcciones={correcciones}
      />

      <p className="mt-3 text-xs text-texto-suave">
        Fechas cargadas por la comunidad, no por las federaciones. Confirmalas
        siempre en la página oficial de quien organiza. Si sabés algo que falta
        —una fecha nueva, una aclaración—, tocá el torneo y agregalo.
      </p>
    </section>
  );
}
