import Link from "next/link";

import { crearClienteServidor } from "@/lib/supabase/server";
import {
  colorFederacion,
  diasHasta,
  nombreOrganizador,
  rangoDeFechas,
} from "@/lib/torneos";

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

  const { data } = await supabase
    .from("torneos")
    .select("id, nombre, federacion, salas(nombre), fecha_inicio, fecha_fin, lugar, cierre_inscripcion")
    .gte("fecha_inicio", iso(hoy))
    .lte("fecha_inicio", iso(enUnMes))
    .order("fecha_inicio")
    .limit(4);

  const torneos = data ?? [];
  if (torneos.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-borde bg-fondo-sutil p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Torneos del próximo mes</h2>
        <Link href="/torneos" className="text-sm text-acento underline">
          Ver el calendario completo
        </Link>
      </div>

      <ul className="mt-3 grid sm:grid-cols-2 gap-2">
        {torneos.map((t) => {
          const dias = t.cierre_inscripcion ? diasHasta(t.cierre_inscripcion) : null;
          return (
            <li
              key={t.id}
              className="rounded-lg border border-borde bg-fondo-elevado p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${colorFederacion(
                    t.federacion,
                  )}`}
                >
                  {nombreOrganizador(t.federacion, t.salas?.nombre)}
                </span>
                <span className="text-sm font-medium">
                  {rangoDeFechas(t.fecha_inicio!, t.fecha_fin)}
                </span>
              </div>

              <p className="mt-1 text-sm font-medium leading-snug">{t.nombre}</p>
              {t.lugar && (
                <p className="text-xs text-texto-suave">{t.lugar}</p>
              )}

              {dias !== null && dias >= 0 && (
                <p
                  className={`text-xs mt-1 ${
                    dias <= 10 ? "text-alerta" : "text-texto-suave"
                  }`}
                >
                  {dias === 0
                    ? "La inscripción cierra hoy"
                    : `Cierra la inscripción en ${dias} ${dias === 1 ? "día" : "días"}`}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-texto-suave">
        Fechas cargadas por la comunidad, no por las federaciones. Confirmalas
        siempre en la página oficial de quien organiza.
      </p>
    </section>
  );
}
