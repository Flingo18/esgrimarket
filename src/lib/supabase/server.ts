import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

/**
 * Cliente de Supabase para Server Components, Server Actions y route handlers.
 * Usa la clave anónima, así que todas las consultas pasan por las políticas
 * RLS definidas en supabase/schema.sql. Esa es toda la seguridad del proyecto
 * y es la razón por la que no hace falta más.
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Los Server Components no pueden escribir cookies. El middleware
            // ya se encarga de refrescar la sesión, así que ignorarlo es correcto.
          }
        },
      },
    },
  );
}
