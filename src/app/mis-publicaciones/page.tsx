import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { marcarVendida, reactivar } from "@/acciones/publicar";
import { BotonBorrar } from "@/components/boton-borrar";
import { Precio } from "@/components/precio";
import { obtenerCotizacion } from "@/lib/dolar";
import { urlFoto } from "@/lib/publicaciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mis publicaciones" };

const SITUACIONES: Record<string, { label: string; clase: string }> = {
  activa: { label: "Activa", clase: "bg-acento-suave text-acento" },
  vendida: { label: "Vendida", clase: "bg-fondo-sutil text-texto-suave" },
  pausada: { label: "Pausada", clase: "bg-fondo-sutil text-texto-suave" },
  vencida: { label: "Vencida", clase: "bg-fondo-sutil text-texto-suave" },
};

const BOTON =
  "rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento";

function diasRestantes(vence: string): number {
  return Math.ceil((new Date(vence).getTime() - Date.now()) / 86_400_000);
}

export default async function MisPublicaciones({
  searchParams,
}: PageProps<"/mis-publicaciones">) {
  const { error } = await searchParams;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const [{ data: publicaciones }, { data: limiteCupo }, cotizacion] = await Promise.all([
    supabase
      .from("publicaciones")
      .select(
        "id, titulo, moneda_base, monto, situacion, vence_en, contactos, creado_en, fotos(path, orden)",
      )
      .eq("autor_id", user.id)
      .order("creado_en", { ascending: false }),
    supabase.rpc("limite_efectivo", { usuario: user.id }),
    obtenerCotizacion(),
  ]);

  const lista = publicaciones ?? [];
  const activas = lista.filter((p) => p.situacion === "activa").length;
  const limite = limiteCupo ?? 5;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Mis publicaciones</h1>
        <Link
          href="/publicar"
          className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-2 hover:opacity-90"
        >
          Publicar
        </Link>
      </div>

      <p className="mt-1 text-texto-suave">
        {activas} de {limite} activas.
        {activas >= limite && " Marcá alguna como vendida para liberar lugar."}
      </p>

      {typeof error === "string" && (
        <p className="mt-4 rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          {error}
        </p>
      )}

      {lista.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-medium">Todavía no publicaste nada</p>
          <Link
            href="/publicar"
            className="inline-block mt-5 rounded-lg bg-acento text-acento-texto font-medium px-5 py-2.5 hover:opacity-90"
          >
            Publicar algo
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {lista.map((p) => {
            const foto = [...p.fotos].sort((a, b) => a.orden - b.orden)[0];
            const situacion = SITUACIONES[p.situacion] ?? SITUACIONES.activa;
            const dias = diasRestantes(p.vence_en);

            return (
              <li
                key={p.id}
                className="rounded-xl border border-borde bg-fondo-elevado p-3 flex gap-3"
              >
                <div className="relative size-20 shrink-0 rounded-lg overflow-hidden bg-fondo-sutil">
                  {foto ? (
                    <Image
                      src={urlFoto(foto.path)}
                      alt={p.titulo}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-xs text-texto-suave">
                      Sin foto
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <Link href={`/p/${p.id}`} className="font-medium hover:text-acento">
                      {p.titulo}
                    </Link>
                    <span
                      className={`shrink-0 text-xs rounded-md px-1.5 py-0.5 ${situacion.clase}`}
                    >
                      {situacion.label}
                    </span>
                  </div>

                  <div className="mt-1">
                    <Precio
                      monto={p.monto}
                      monedaBase={p.moneda_base}
                      cotizacion={cotizacion}
                    />
                  </div>

                  <p className="mt-1 text-xs text-texto-suave">
                    {p.contactos === 0
                      ? "Nadie la consultó todavía"
                      : `${p.contactos} ${p.contactos === 1 ? "consulta" : "consultas"} por WhatsApp`}
                    {p.situacion === "activa" &&
                      (dias > 0
                        ? ` · vence en ${dias} ${dias === 1 ? "día" : "días"}`
                        : " · vencida")}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/p/${p.id}/editar`} className={BOTON}>
                      Editar
                    </Link>

                    {p.situacion === "activa" ? (
                      <form action={marcarVendida}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className={BOTON}>
                          Marcar vendida
                        </button>
                      </form>
                    ) : (
                      <form action={reactivar}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className={BOTON}>
                          Volver a publicar
                        </button>
                      </form>
                    )}

                    <BotonBorrar id={p.id} clase={BOTON} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
