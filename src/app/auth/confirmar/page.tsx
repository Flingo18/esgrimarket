import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

import { crearClienteServidor } from "@/lib/supabase/server";

import { RescatarDesdeElFragmento } from "./fragmento";

/**
 * Recibe el click del link del mail.
 *
 * Supabase manda tres formatos distintos según cómo se haya pedido el acceso
 * y qué template esté configurado, y los tres tienen que funcionar:
 *
 *   1. `?code=...`              → flujo PKCE, el que sale al pedir el código
 *                                 desde el servidor. Es el que fallaba: la
 *                                 versión anterior sólo miraba token_hash.
 *   2. `?token_hash=&type=`     → verificación directa del código.
 *   3. `#access_token=...`      → flujo implícito. Va en el fragmento, que
 *                                 nunca llega al servidor: hay que leerlo
 *                                 desde el navegador.
 */
export default async function ConfirmarPage({
  searchParams,
}: PageProps<"/auth/confirmar">) {
  const params = await searchParams;
  const leer = (k: string) => {
    const v = params[k];
    return typeof v === "string" && v ? v : null;
  };

  const destino = leer("next") ?? "/";
  const supabase = await crearClienteServidor();

  const code = leer("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) redirect("/ingresar?error=link_vencido");
    redirect(destino);
  }

  const token_hash = leer("token_hash");
  const type = leer("type") as EmailOtpType | null;
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    // Vencido o ya usado: algunos servidores de correo visitan los links para
    // escanearlos y los queman antes de que llegue la persona.
    if (error) redirect("/ingresar?error=link_vencido");
    redirect(destino);
  }

  // Sin nada en la query: puede estar en el fragmento, que sólo ve el
  // navegador. Se intenta desde el cliente antes de dar el link por perdido.
  return <RescatarDesdeElFragmento destino={destino} />;
}
