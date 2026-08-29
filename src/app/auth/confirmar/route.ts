import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Recibe el click del link del mail.
 *
 * Hace falta porque el template gratuito de Supabase no se puede editar: manda
 * lo que manda. Con esta ruta funcionan los dos flujos — si el mail trae un
 * link, cae acá; si trae el código de 6 dígitos, se escribe en el formulario.
 * Cuando haya SMTP propio y se pueda fijar el template, se elige uno solo.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const destino = searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    redirect("/ingresar?error=link_invalido");
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    // Vencido o ya usado: los clientes de mail a veces pre-visitan los links
    // y los queman antes de que la persona haga click.
    redirect("/ingresar?error=link_vencido");
  }

  redirect(destino);
}
