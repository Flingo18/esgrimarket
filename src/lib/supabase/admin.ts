import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Cliente con la clave de servicio. Saltea RLS por completo.
 *
 * Sólo para operaciones que un usuario no puede hacer con su propia sesión,
 * como borrarse la cuenta: la API de administración de Supabase no acepta la
 * clave pública para eso.
 *
 * Nunca debe importarse desde un componente de cliente.
 */
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY.");

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
