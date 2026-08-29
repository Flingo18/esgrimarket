import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";

/**
 * Refresca el token de sesión en cada request.
 *
 * Sin esto, los Server Components ven sesiones vencidas y el usuario aparece
 * deslogueado sin motivo: ellos no pueden escribir cookies, así que alguien
 * tiene que renovar el token antes de que corran. Ese alguien es el middleware.
 */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() y no getSession(): éste valida el token contra el servidor de
  // Supabase. getSession() confía en la cookie, que el cliente puede falsear.
  await supabase.auth.getUser();

  return respuesta;
}
