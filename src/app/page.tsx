import Link from "next/link";

import { Filtros } from "@/components/filtros";
import { TarjetaPublicacion } from "@/components/tarjeta-publicacion";
import { TorneosProximos } from "@/components/torneos-proximos";
import { obtenerCotizacion } from "@/lib/dolar";
import { listarPublicaciones, type Filtros as TipoFiltros } from "@/lib/publicaciones";
import type { Arma, Categoria, Mano } from "@/lib/taxonomy";

export default async function Inicio({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const leer = (k: string) => {
    const v = params[k];
    return typeof v === "string" && v ? v : undefined;
  };

  const filtros: TipoFiltros = {
    texto: leer("q"),
    categoria: leer("categoria") as Categoria | undefined,
    arma: leer("arma") as Arma | undefined,
    mano: leer("mano") as Mano | undefined,
    zona: leer("zona"),
    orden: leer("orden") as TipoFiltros["orden"],
  };

  // En paralelo: la cotización no depende del listado y esperarlas en serie
  // sumaría medio segundo a cada carga.
  const [publicaciones, cotizacion] = await Promise.all([
    listarPublicaciones(filtros),
    obtenerCotizacion(),
  ]);

  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Equipamiento de esgrima usado en Argentina
        </h1>
        <p className="text-texto-suave mt-1">
          Comprá y vendé entre gente de la comunidad: floretes, espadas, sables,
          caretas, chaquetillas y cables. El contacto es directo por WhatsApp.
        </p>
      </div>

      {/* Antes del listado: quien entra a mirar equipamiento se cruza con las
          fechas que se le vienen encima. */}
      <TorneosProximos />

      <div className="mt-8" />

      <Filtros
        valores={{
          q: leer("q"),
          categoria: leer("categoria"),
          arma: leer("arma"),
          mano: leer("mano"),
          zona: leer("zona"),
          orden: leer("orden"),
        }}
      />

      {publicaciones.length === 0 ? (
        <div className="mt-16 text-center">
          {hayFiltros ? (
            <>
              <p className="text-lg font-medium">No hay nada con esos filtros</p>
              <p className="text-texto-suave mt-1">
                Probá aflojando alguno.{" "}
                <Link href="/" className="text-acento underline">
                  Ver todo
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Todavía no hay publicaciones</p>
              <p className="text-texto-suave mt-1 max-w-md mx-auto">
                Sé el primero. Publicá ese florete que no usás más, esa chaqueta
                que te quedó chica, o el bolso que juntó polvo todo el año.
              </p>
              <Link
                href="/publicar"
                className="inline-block mt-6 rounded-lg bg-acento text-acento-texto font-medium px-5 py-2.5 hover:opacity-90"
              >
                Publicar algo
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {publicaciones.map((p) => (
            <TarjetaPublicacion key={p.id} publicacion={p} cotizacion={cotizacion} />
          ))}
        </div>
      )}
    </div>
  );
}
