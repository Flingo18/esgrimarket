"use server";

import { redirect } from "next/navigation";

import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Manda el mail de ingreso.
 *
 * El plan gratuito de Supabase no deja editar los templates, y el que viene
 * de fábrica manda un LINK, no un código. Por eso el flujo es por link
 * aunque el código sea mejor: el link se abre en el navegador de la app de
 * mail y la sesión puede quedar iniciada en el lugar equivocado.
 *
 * Cuando haya SMTP propio: cambiar el template a `{{ .Token }}` y volver a
 * enganchar `validarCodigo`, que ya está escrito más abajo.
 */
export async function pedirCodigo(
  _estadoPrevio: unknown,
  datos: FormData,
): Promise<{ error?: string; email?: string }> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Escribí un mail válido." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Adónde vuelve si el mail trae un link en vez del código.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirmar`,
    },
  });

  if (error) {
    // Se registra el error real: el mensaje genérico que veía el usuario
    // escondía la causa y obligaba a ir a buscarla a los logs de Supabase.
    console.error("signInWithOtp falló:", error.status, error.code, error.message);

    // El límite de mails del plan gratuito es la causa más común de lejos,
    // y merece un mensaje que diga qué pasa y qué hacer.
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return {
        error:
          "Se alcanzó el límite de mails por hora. Esperá un rato y probá de nuevo.",
      };
    }

    return { error: "No pudimos mandar el mail. Probá de nuevo en un minuto." };
  }

  return { email };
}

/** Valida el código y deja la sesión abierta. */
export async function validarCodigo(
  _estadoPrevio: unknown,
  datos: FormData,
): Promise<{ error?: string; email?: string }> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const token = String(datos.get("codigo") ?? "").replace(/\D/g, "");

  // El largo lo define Supabase en su configuración (este proyecto manda 8,
  // pero es un valor que se puede cambiar desde el panel). Aceptar un rango
  // evita que cambiar esa opción rompa el login sin que nadie se entere.
  if (token.length < 6 || token.length > 10) {
    return { email, error: "Copiá el código completo que te llegó por mail." };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error) {
    return { email, error: "El código no coincide o ya venció. Pedí uno nuevo." };
  }

  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
