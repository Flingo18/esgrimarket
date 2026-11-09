import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { avisarVencimiento, hayClaveResend } from "@/lib/avisos";
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
 *
 * Cada aviso queda registrado en la propia fila. Antes se decidía a quién
 * avisarle con una ventana de 24 h calculada sobre el reloj de la corrida, y
 * eso tenía dos agujeros: si el cron arrancaba unos minutos más tarde que el
 * día anterior, lo que vencía en ese hueco no entraba en ninguna ventana y no
 * recibía aviso nunca; y si la corrida se repetía, todos los mails del día
 * salían de nuevo. Con la marca en la fila, el aviso sale exactamente una vez
 * y una corrida perdida se recupera sola al día siguiente.
 */

const DIA = 24 * 60 * 60 * 1000;

/** "26 de octubre", en hora de Argentina y no la del servidor. */
const FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
});

type AVencer = { id: string; titulo: string; autor_id: string; vence_en: string };

type Columna = "aviso_vencida_en" | "aviso_por_vencer_en";

type Resumen = {
  pendientes: number;
  enviados: number;
  fallidos: number;
  motivos: string[];
};

/**
 * Manda un aviso por publicación y deja constancia de que salió.
 *
 * `perfiles` no guarda el mail: vive en `auth.users`, al que sólo llega la
 * service role key. Los autores se cachean porque alguien con diez
 * publicaciones venciendo el mismo día daría diez consultas idénticas.
 *
 * Que un aviso no salga no puede romper el cron: lo que importa es que las
 * publicaciones se hayan vencido. Pero sí queda contado, porque una corrida
 * donde no salió ningún mail no puede informarse igual que un día tranquilo.
 */
async function avisar(
  admin: ReturnType<typeof createClient<Database>>,
  publicaciones: AVencer[],
  vencida: boolean,
): Promise<Resumen> {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "https://esgrimarket.com.ar";
  const columna: Columna = vencida ? "aviso_vencida_en" : "aviso_por_vencer_en";
  const mails = new Map<string, string | null>();
  const r: Resumen = {
    pendientes: publicaciones.length,
    enviados: 0,
    fallidos: 0,
    motivos: [],
  };

  const anotar = (motivo: string) => {
    // Un mismo fallo repetido veinte veces no dice más que una: suele ser la
    // misma causa para todos.
    if (!r.motivos.includes(motivo)) r.motivos.push(motivo);
  };

  // Las dos columnas por separado y no una clave calculada: con `[columna]`
  // el tipo del update se ensancha a "cualquier string" y deja de validar
  // contra el esquema, que es justo lo que uno quiere que valide acá.
  //
  // Ojo: marcar dispara `trg_pub_actualizado`, así que `actualizado_en` se
  // mueve y con él el `lastModified` que el sitemap le declara a Google. Se
  // acepta: pasa una sola vez por publicación y justo en la semana previa a
  // que desaparezca del listado. La marca de "vencida" ni siquiera se nota,
  // porque el sitemap lee con RLS y las vencidas ya no están ahí.
  const marcar = (id: string) => {
    const sello = new Date().toISOString();
    const campos =
      columna === "aviso_vencida_en"
        ? { aviso_vencida_en: sello }
        : { aviso_por_vencer_en: sello };
    return admin.from("publicaciones").update(campos).eq("id", id);
  };

  for (const p of publicaciones) {
    if (!mails.has(p.autor_id)) {
      const { data, error } = await admin.auth.admin.getUserById(p.autor_id);
      if (error) {
        // Un 503 de la API de cuentas no es una cuenta borrada. Si se
        // confundieran, un corte de unos segundos marcaría como avisadas
        // publicaciones a las que no se les escribió nunca. Sin marcar y sin
        // cachear: mañana se reintenta.
        r.fallidos += 1;
        anotar(`no se pudo leer el mail del autor: ${error.message}`);
        continue;
      }
      mails.set(p.autor_id, data.user?.email ?? null);
    }

    const para = mails.get(p.autor_id);
    if (!para) {
      // Acá sí: la consulta respondió y esa cuenta no existe o no tiene mail.
      // Se marca para no reintentarlo todos los días para siempre.
      await marcar(p.id);
      continue;
    }

    const envio = await avisarVencimiento({
      para,
      titulo: p.titulo,
      cuando: FECHA.format(new Date(p.vence_en)),
      // El ancla deja la publicación a la vista sin tener que buscarla.
      url: `${sitio}/mis-publicaciones#p-${p.id}`,
      vencida,
    });

    if (!envio.ok) {
      r.fallidos += 1;
      anotar(envio.motivo);
      // Sin marcar: mañana se reintenta.
      continue;
    }

    r.enviados += 1;

    // Se marca DESPUÉS de que el mail salió. Al revés, un envío fallido
    // quedaría marcado y esa persona no se enteraría nunca; así, lo peor que
    // puede pasar es repetir un aviso.
    const { error } = await marcar(p.id);
    if (error) anotar(`el aviso salió pero no se pudo marcar: ${error.message}`);
  }

  return r;
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
  const problemas: string[] = [];

  // Lo primero que se mira cuando los avisos no llegan. Antes había que
  // deducirlo de un contador en cero.
  resultado.resend = hayClaveResend() ? "configurado" : "FALTA RESEND_API_KEY";
  if (!hayClaveResend()) problemas.push("falta RESEND_API_KEY");

  const { data: vencidas, error: errorVencer } = await admin.rpc("vencer_publicaciones");
  resultado.vencidas = errorVencer ? `error: ${errorVencer.message}` : vencidas;
  if (errorVencer) problemas.push(`vencer_publicaciones: ${errorVencer.message}`);

  // Los dos avisos van DESPUÉS de vencer. A quién le toca no depende de
  // cuándo corrió el cron, sino de si ya se le avisó: lo que no salió hoy
  // sigue pendiente mañana.
  //
  // Las cuentas admin y pro no aparecen en ninguna de las dos consultas, y es
  // correcto: `vencer_publicaciones()` les corre el vencimiento a un año antes
  // de vencer nada, así que nunca están por vencerse.
  const ahora = Date.now();

  // La cola de vencidas lleva cota: "se venció hace tres días, reactivala"
  // sirve; "se venció hace cinco semanas" es spam. Sin esta ventana, un mes
  // sin poder mandar mails —porque falta la clave de Resend, por ejemplo— se
  // descarga entero el día que se arregla, con fechas viejas y todo junto.
  const { data: recienVencidas, error: errorVencidas } = await admin
    .from("publicaciones")
    .select("id, titulo, autor_id, vence_en")
    .eq("situacion", "vencida")
    .is("aviso_vencida_en", null)
    .gt("vence_en", new Date(ahora - 7 * DIA).toISOString());

  if (errorVencidas) problemas.push(`consulta de vencidas: ${errorVencidas.message}`);

  const { data: porVencer, error: errorPorVencer } = await admin
    .from("publicaciones")
    .select("id, titulo, autor_id, vence_en")
    .eq("situacion", "activa")
    .is("aviso_por_vencer_en", null)
    .gt("vence_en", new Date(ahora).toISOString())
    .lte("vence_en", new Date(ahora + 7 * DIA).toISOString());

  if (errorPorVencer) problemas.push(`consulta de por vencer: ${errorPorVencer.message}`);

  try {
    const avisoVencidas = await avisar(admin, recienVencidas ?? [], true);
    const avisoPorVencer = await avisar(admin, porVencer ?? [], false);

    resultado.aviso_vencidas = avisoVencidas;
    resultado.aviso_por_vencer = avisoPorVencer;

    for (const r of [avisoVencidas, avisoPorVencer]) {
      if (r.fallidos > 0) problemas.push(`${r.fallidos} avisos no salieron: ${r.motivos.join(" | ")}`);
    }
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e);
    console.error("Error mandando avisos de vencimiento:", e);
    resultado.avisos = `error: ${motivo}`;
    problemas.push(`avisos: ${motivo}`);
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
    if (error) problemas.push(`cotización: ${error.message}`);
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
    problemas.push(`fotos huérfanas: ${errorHuerfanas.message}`);
  } else {
    const rutas = (huerfanas ?? []).map((f) => f.ruta);
    if (rutas.length > 0) {
      const { error } = await admin.storage.from("fotos").remove(rutas);
      resultado.fotos_huerfanas = error ? `error: ${error.message}` : rutas.length;
      if (error) problemas.push(`borrar fotos: ${error.message}`);
    } else {
      resultado.fotos_huerfanas = 0;
    }
  }

  // Responder 500 cuando algo falló es lo que hace que Vercel marque la
  // corrida en rojo. Con 200 siempre, un cron que no mandó un solo mail se
  // veía igual que uno que anduvo perfecto. Reintentar es seguro: los avisos
  // ya enviados están marcados y no se repiten.
  resultado.problemas = problemas;
  return Response.json(resultado, { status: problemas.length > 0 ? 500 : 200 });
}
