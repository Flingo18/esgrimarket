import Link from "next/link";

import { cerrarSesion } from "@/acciones/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function Encabezado() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-borde sticky top-0 z-40 bg-fondo/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold tracking-tight text-lg shrink-0">
          Esgrimarket
        </Link>

        <Link href="/mapa" className="text-sm text-texto-suave hover:text-texto">
          Mapa
        </Link>

        <div className="flex-1" />

        {user ? (
          <>
            <Link
              href="/mis-publicaciones"
              className="text-sm text-texto-suave hover:text-texto hidden sm:block"
            >
              Mis publicaciones
            </Link>
            <Link
              href="/cuenta"
              className="text-sm text-texto-suave hover:text-texto"
            >
              Mi cuenta
            </Link>
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
