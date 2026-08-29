import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Recibe el click del link del mail.
 *
 * Tiene que ser un route handler y no una página: sólo acá se pueden escribir
 * cookies, y sin eso `verifyOtp` valida el token pero la sesión no se guarda.
 * El síntoma es engañoso — Supabase responde 200 y el usuario vuelve a la
 * pantalla de ingreso sin ningún error.
 *
 * Supabase manda tres formatos según cómo se pidió el acceso:
 *   1. `?code=...`          → flujo PKCE, el de pedir el código desde el servidor.
 *   2. `?token_hash=&type=` → verificación directa.
 *   3. `#access_token=...`  → flujo implícito; viaja en el fragmento, que no
 *                             llega al servidor. Se delega a /auth/fragmento.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const destino = searchParams.get("next") ?? "/";
  const supabase = await crearClienteServidor();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) redirect("/ingresar?error=link_vencido");
    redirect(destino);
  }

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    // Vencido o ya usado: algunos servidores de correo visitan los links para
    // escanearlos y los queman antes de que llegue la persona.
    if (error) redirect("/ingresar?error=link_vencido");
    redirect(destino);
  }

  redirect(`/auth/fragmento?next=${encodeURIComponent(destino)}`);
}
