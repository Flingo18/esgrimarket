import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { avisarVencimiento } from "@/lib/avisos";
import { obtenerCotizacion } from "@/lib/dolar";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Tareas diarias. Las dispara Vercel Cron, no un usuario.
 *
 * 1. Vencer las publicaciones que pasaron los 45 días.
 * 2. Avisarle por mail a quien publicó: una semana antes y el día que venció.
 * 3. Guardar la cotización del día como respaldo, para que el listado siga
 *    mostrando precios en pesos si las dos APIs se caen.
 * 4. Borrar las fotos que quedaron en el bucket sin publicación que las use.
 *
 * Usa la service role key porque `vencer_publicaciones()` está revocada para
 * anon y authenticated: no tiene por qué poder llamarla cualquiera.
 */

const DIA = 24 * 60 * 60 * 1000;

/** "26 de octubre", en hora de Argentina y no la del servidor. */
const FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
});

type AVencer = { id: string; titulo: string; autor_id: string; vence_en: string };

/**
 * Manda un aviso por publicación, resolviendo el mail del autor.
 *
 * `perfiles` no guarda el mail: vive en `auth.users`, al que sólo llega la
 * service role key. Los autores se cachean porque alguien con diez
 * publicaciones venciendo el mismo día daría diez consultas idénticas.
 *
 * Devuelve cuántos mails salieron de verdad. Que un aviso no salga no puede
 * romper el cron: lo que importa es que las publicaciones se hayan vencido.
 */
async function avisar(
  admin: ReturnType<typeof createClient<Database>>,
  publicaciones: AVencer[],
  vencida: boolean,
): Promise<number> {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "https://esgrimarket.com.ar";
  const mails = new Map<string, string | null>();
  let salieron = 0;

  for (const p of publicaciones) {
    if (!mails.has(p.autor_id)) {
      const { data } = await admin.auth.admin.getUserById(p.autor_id);
      mails.set(p.autor_id, data.user?.email ?? null);
    }

    const para = mails.get(p.autor_id);
    if (!para) continue;

    const salio = await avisarVencimiento({
      para,
      titulo: p.titulo,
      cuando: FECHA.format(new Date(p.vence_en)),
      // El ancla deja la publicación a la vista sin tener que buscarla.
      url: `${sitio}/mis-publicaciones#p-${p.id}`,
      vencida,
    });
    if (salio) salieron += 1;
  }

  return salieron;
}
export async function GET(request: NextRequest) {
  // Vercel Cron manda `Authorization: Bearer <CRON_SECRET>`. Sin esta
  // comprobación, la URL queda expuesta a cualquiera que la adivine.
  const esperado = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== esperado) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const resultado: Record<string, unknown> = {};

  const { data: vencidas, error: errorVencer } = await admin.rpc("vencer_publicaciones");
  resultado.vencidas = errorVencer ? `error: ${errorVencer.message}` : vencidas;

  // Los dos avisos van DESPUÉS de vencer, y los dos se definen por la ventana
  // de un día que separa una corrida de la siguiente. Así no hace falta una
  // columna que recuerde a quién ya se le avisó: lo que entró en la ventana
  // hoy, mañana ya no entra.
  //
  // Las cuentas admin y pro no aparecen en ninguna de las dos consultas, y es
  // correcto: `vencer_publicaciones()` les corre el vencimiento a un año antes
  // de vencer nada, así que nunca están por vencerse.
  const ahora = Date.now();

  const { data: recienVencidas } = await admin
    .from("publicaciones")
    .select("id, titulo, autor_id, vence_en")
    .eq("situacion", "vencida")
    .gt("vence_en", new Date(ahora - DIA).toISOString())
    .lte("vence_en", new Date(ahora).toISOString());

  const { data: porVencer } = await admin
    .from("publicaciones")
    .select("id, titulo, autor_id, vence_en")
    .eq("situacion", "activa")
    .gt("vence_en", new Date(ahora + 6 * DIA).toISOString())
    .lte("vence_en", new Date(ahora + 7 * DIA).toISOString());

  try {
    resultado.aviso_vencidas = await avisar(admin, recienVencidas ?? [], true);
    resultado.aviso_por_vencer = await avisar(admin, porVencer ?? [], false);
  } catch (e) {
    // Un aviso que no sale no puede tumbar el resto de las tareas del día.
    console.error("Error mandando avisos de vencimiento:", e);
    resultado.aviso_vencidas = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  const cotizacion = await obtenerCotizacion();
  if (cotizacion) {
    const { error } = await admin.from("cotizacion_cache").upsert({
      id: true,
      venta: cotizacion.venta,
      fuente: cotizacion.fuente,
      actualizado: new Date().toISOString(),
    });
    resultado.cotizacion = error ? `error: ${error.message}` : cotizacion.venta;
  } else {
    resultado.cotizacion = "las dos APIs fallaron, se conserva el valor anterior";
  }

  // Fotos huérfanas: el formulario sube la imagen antes de crear la
  // publicación, así que abandonar el formulario deja el archivo colgado.
  const { data: huerfanas, error: errorHuerfanas } = await admin.rpc(
    "fotos_huerfanas",
    { horas: 24 },
  );

  if (errorHuerfanas) {
    resultado.fotos_huerfanas = `error: ${errorHuerfanas.message}`;
  } else {
    const rutas = (huerfanas ?? []).map((f) => f.ruta);
    if (rutas.length > 0) {
      const { error } = await admin.storage.from("fotos").remove(rutas);
      resultado.fotos_huerfanas = error ? `error: ${error.message}` : rutas.length;
    } else {
      resultado.fotos_huerfanas = 0;
    }
  }

  return Response.json(resultado);
}
