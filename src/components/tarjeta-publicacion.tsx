import Image from "next/image";
import Link from "next/link";

import { Precio } from "@/components/precio";
import type { Cotizacion } from "@/lib/dolar";
import { etiquetaUbicacion } from "@/lib/geo";
import { urlFoto, type PublicacionListada } from "@/lib/publicaciones";
import { ARMAS, ESTADOS, MANOS, metaTipo, type Categoria } from "@/lib/taxonomy";

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs rounded-md border border-borde px-1.5 py-0.5 text-texto-suave">
      {children}
    </span>
  );
}

export function TarjetaPublicacion({
  publicacion: p,
  cotizacion,
}: {
  publicacion: PublicacionListada;
  cotizacion: Cotizacion | null;
}) {
  const foto = [...p.fotos].sort((a, b) => a.orden - b.orden)[0];
  const meta = metaTipo(p.categoria as Categoria, p.tipo);

  // Si sirve para las tres armas no vale la pena listarlas: ocupa lugar y no
  // ayuda a decidir. Sólo se muestra cuando el ítem es específico.
  const armas =
    p.armas_compatibles.length > 0 && p.armas_compatibles.length < 3
      ? p.armas_compatibles.map((a) => ARMAS[a as keyof typeof ARMAS]).join(" · ")
      : null;

  return (
    <Link
      href={`/p/${p.id}`}
      className="group rounded-xl border border-borde bg-fondo-elevado overflow-hidden hover:border-acento transition-colors"
    >
      <div className="aspect-4/3 bg-fondo-sutil relative">
        {foto ? (
          <Image
            src={urlFoto(foto.path)}
            alt={p.titulo}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-texto-suave text-sm">
            Sin foto
          </div>
        )}
        {p.es_oficial && (
          <span className="absolute top-2 left-2 text-xs font-medium rounded-md bg-acento text-acento-texto px-2 py-1">
            Tienda
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-medium leading-snug line-clamp-2 group-hover:text-acento">
          {p.titulo}
        </h3>

        <Precio monto={p.monto} monedaBase={p.moneda_base} cotizacion={cotizacion} />

        <div className="flex flex-wrap gap-1">
          {meta && <Etiqueta>{meta.label}</Etiqueta>}
          {armas && <Etiqueta>{armas}</Etiqueta>}
          {p.talle && (
            // Un cable no tiene "talle": tiene largo. Decirlo mal delata que
            // el que armó esto no practica el deporte.
            <Etiqueta>
              {meta?.talle === "cable" ? p.talle : `Talle ${p.talle}`}
            </Etiqueta>
          )}
          {p.mano && p.mano !== "indistinto" && (
            <Etiqueta>{MANOS[p.mano as keyof typeof MANOS]}</Etiqueta>
          )}
          <Etiqueta>{ESTADOS[p.estado as keyof typeof ESTADOS]}</Etiqueta>
        </div>

        <p className="text-xs text-texto-suave">
          {etiquetaUbicacion(p.zona, p.barrio)}
        </p>
      </div>
    </Link>
  );
}
