import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { obtenerCotizacion } from "@/lib/dolar";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Tareas diarias. Las dispara Vercel Cron, no un usuario.
 *
 * 1. Vencer las publicaciones que pasaron los 45 días.
 * 2. Guardar la cotización del día como respaldo, para que el listado siga
 *    mostrando precios en pesos si las dos APIs se caen.
 *
 * Usa la service role key porque `vencer_publicaciones()` está revocada para
 * anon y authenticated: no tiene por qué poder llamarla cualquiera.
 */
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

  return Response.json(resultado);
}
