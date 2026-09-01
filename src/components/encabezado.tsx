import Link from "next/link";

import { cerrarSesion } from "@/acciones/auth";
import { Logo } from "@/components/logo";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Correcciones que esta persona todavía puede avalar. */
async function porAvalar(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  usuario: string,
): Promise<number> {
  const { data: abiertas } = await supabase
    .from("correcciones")
    .select("id")
    .eq("situacion", "pendiente")
    .neq("propuesta_por", usuario);

  if (!abiertas?.length) return 0;

  const { data: mios } = await supabase
    .from("correcciones_votos")
    .select("correccion_id")
    .eq("usuario_id", usuario)
    .in("correccion_id", abiertas.map((c) => c.id));

  const yaVotadas = new Set((mios ?? []).map((v) => v.correccion_id));
  return abiertas.filter((c) => !yaVotadas.has(c.id)).length;
}

export async function Encabezado() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: esAdmin } = user
    ? await supabase.rpc("es_admin")
    : { data: false };

  // El contador es lo que hace que alguien entre a avalar: una cola escondida
  // no la drena nadie. Sólo cuenta lo que esta persona todavía puede avalar,
  // porque un número que no baja cuando hacés algo deja de significar nada.
  const pendientes = user ? await porAvalar(supabase, user.id) : 0;

  return (
    <header className="border-b border-borde sticky top-0 z-40 bg-fondo/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-lg shrink-0"
        >
          <Logo className="size-7 text-acento" />
          Esgrimarket
        </Link>

        {/* El logo ya lleva al inicio, pero eso hay que saberlo. Un enlace
            que dice a dónde va no obliga a adivinar. */}
        <Link href="/" className="text-sm text-texto-suave hover:text-texto">
          Comprar
        </Link>
        <Link href="/torneos" className="text-sm text-texto-suave hover:text-texto">
          Torneos
        </Link>
        <Link href="/mapa" className="text-sm text-texto-suave hover:text-texto">
          Mapa
        </Link>

        <div className="flex-1" />

        {user ? (
          <>
            <Link
              href="/busquedas"
              className="text-sm text-texto-suave hover:text-texto hidden sm:block"
            >
              Busco
            </Link>
            <Link
              href="/mis-publicaciones"
              className="text-sm text-texto-suave hover:text-texto hidden sm:block"
            >
              Mis publicaciones
            </Link>
            <Link
              href="/correcciones"
              className="text-sm text-texto-suave hover:text-texto hidden sm:block"
            >
              Correcciones
              {pendientes > 0 && (
                <span className="ml-1 rounded-full bg-acento text-acento-texto text-xs px-1.5">
                  {pendientes}
                </span>
              )}
            </Link>
            <Link
              href="/cuenta"
              className="text-sm text-texto-suave hover:text-texto"
            >
              Mi cuenta
            </Link>
            {esAdmin && (
              <Link
                href="/admin"
                className="text-sm text-texto-suave hover:text-texto"
              >
                Admin
              </Link>
            )}
            <Link
              href="/publicar"
              className="text-sm font-medium rounded-lg px-3 py-1.5 bg-acento text-acento-texto hover:opacity-90"
            >
              Publicar
            </Link>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="text-sm text-texto-suave hover:text-texto"
              >
                Salir
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/ingresar"
            className="text-sm font-medium rounded-lg px-3 py-1.5 bg-acento text-acento-texto hover:opacity-90"
          >
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
}
