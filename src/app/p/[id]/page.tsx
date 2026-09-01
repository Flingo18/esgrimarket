import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Precio } from "@/components/precio";
import { obtenerCotizacion } from "@/lib/dolar";
import { etiquetaZonas } from "@/lib/geo";
import { urlFoto } from "@/lib/publicaciones";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  ARMAS,
  EMPUNADURAS,
  ESTADOS,
  MANOS,
  NIVELES_PROTECCION,
  metaTipo,
  type Categoria,
} from "@/lib/taxonomy";

const COLUMNAS =
  "id, titulo, descripcion, categoria, tipo, armas_compatibles, es_electrica, " +
  "empunadura, talle, nivel_proteccion, mano, marca, anio, estado, moneda_base, " +
  "monto, unidades, zonas, barrio, situacion, es_oficial, creado_en, contactos, " +
  "fotos(path, orden), salas(nombre, barrio)";

async function traer(id: string) {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("publicaciones")
    .select(COLUMNAS)
    .eq("id", id)
    .single();
  return data as Record<string, unknown> | null;
}

export async function generateMetadata({
  params,
}: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await traer(id);
  if (!p) return { title: "Publicación no encontrada" };

  const fotos = (p.fotos ?? []) as { path: string; orden: number }[];
  const primera = [...fotos].sort((a, b) => a.orden - b.orden)[0];

  // La preview importa más de lo que parece: el crecimiento va a venir de
  // links pegados en grupos de WhatsApp, y sin imagen nadie los abre.
  return {
    title: p.titulo as string,
    description: (p.descripcion as string) || "Equipamiento de esgrima en venta.",
    openGraph: {
      title: p.titulo as string,
      description: (p.descripcion as string) || "Equipamiento de esgrima en venta.",
      images: primera ? [urlFoto(primera.path)] : [],
      type: "website",
    },
  };
}

function Dato({ nombre, valor }: { nombre: string; valor: React.ReactNode }) {
  if (!valor) return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-borde last:border-0">
      <dt className="text-texto-suave">{nombre}</dt>
      <dd className="text-right font-medium">{valor}</dd>
    </div>
  );
}

export default async function PaginaPublicacion({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const [p, cotizacion] = await Promise.all([traer(id), obtenerCotizacion()]);

  if (!p) notFound();

  const fotos = [...((p.fotos ?? []) as { path: string; orden: number }[])].sort(
    (a, b) => a.orden - b.orden,
  );
  const meta = metaTipo(p.categoria as Categoria, p.tipo as string);
  const armas = (p.armas_compatibles as string[]) ?? [];
  const sala = p.salas as { nombre: string; barrio: string | null } | null;
  const vendida = p.situacion !== "activa";

  // Datos estructurados: sin esto Google ve una página cualquiera; con esto
  // puede mostrarla como un producto, con precio y disponibilidad.
  const datosEstructurados = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.titulo,
    description: p.descripcion || `${meta?.label ?? "Equipamiento de esgrima"} en venta.`,
    image: fotos.map((f) => urlFoto(f.path)),
    brand: p.marca ? { "@type": "Brand", name: p.marca } : undefined,
    offers: {
      "@type": "Offer",
      price: p.monto,
      priceCurrency: p.moneda_base,
      availability: vendida
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      itemCondition:
        p.estado === "nuevo"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
    },
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          {fotos.length > 0 ? (
            fotos.map((f) => (
              <div
                key={f.path}
                className="relative aspect-4/3 rounded-xl overflow-hidden bg-fondo-sutil"
              >
                <Image
                  src={urlFoto(f.path)}
                  alt={p.titulo as string}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))
          ) : (
            <div className="aspect-4/3 rounded-xl bg-fondo-sutil grid place-items-center text-texto-suave">
              Sin fotos
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {p.titulo as string}
          </h1>

          <div className="mt-4">
            <Precio
              monto={p.monto as number}
              monedaBase={p.moneda_base as string}
              cotizacion={cotizacion}
              grande
            />
          </div>

          {vendida ? (
            <p className="mt-6 rounded-lg border border-borde bg-fondo-sutil px-4 py-3 text-center text-texto-suave">
              Esta publicación ya no está disponible.
            </p>
          ) : (
            <a
              href={`/r/${p.id}`}
              className="mt-6 flex items-center justify-center gap-2 w-full rounded-lg bg-precio text-white font-medium py-3 hover:opacity-90"
            >
              Contactar por WhatsApp
            </a>
          )}

          <dl className="mt-8 text-sm">
            <Dato nombre="Qué es" valor={meta?.label} />
            <Dato
              nombre="Sirve para"
              valor={
                armas.length === 3
                  ? "Las tres armas"
                  : armas.map((a) => ARMAS[a as keyof typeof ARMAS]).join(", ")
              }
            />
            <Dato
              nombre="Eléctrica"
              valor={
                p.es_electrica === null ? null : (p.es_electrica as boolean) ? "Sí" : "No"
              }
            />
            <Dato
              nombre={meta?.talle === "cable" ? "Largo" : "Talle"}
              valor={p.talle as string}
            />
            <Dato
              nombre="Empuñadura"
              valor={
                p.empunadura
                  ? EMPUNADURAS[p.empunadura as keyof typeof EMPUNADURAS]
                  : null
              }
            />
            <Dato
              nombre="Protección"
              valor={
                p.nivel_proteccion && p.nivel_proteccion !== "no_aplica"
                  ? NIVELES_PROTECCION[
                      p.nivel_proteccion as keyof typeof NIVELES_PROTECCION
                    ]
                  : null
              }
            />
            <Dato
              nombre="Mano"
              valor={
                p.mano && p.mano !== "indistinto"
                  ? MANOS[p.mano as keyof typeof MANOS]
                  : null
              }
            />
            <Dato nombre="Marca" valor={p.marca as string} />
            <Dato nombre="Año" valor={p.anio as number} />
            <Dato
              nombre="Estado"
              valor={ESTADOS[p.estado as keyof typeof ESTADOS]}
            />
            <Dato
              nombre="Disponibles"
              valor={(p.unidades as number) > 1 ? `${p.unidades} unidades` : null}
            />
            <Dato
              nombre={(p.zonas as string[]).length > 1 ? "Se entrega en" : "Zona"}
              valor={etiquetaZonas(p.zonas as string[], p.barrio as string | null)}
            />
            <Dato
              nombre="Se entrega en"
              valor={sala ? sala.nombre : null}
            />
          </dl>

          {(p.descripcion as string) && (
            <p className="mt-6 whitespace-pre-line text-texto-suave">
              {p.descripcion as string}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
