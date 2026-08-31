import "server-only";

import { crearClienteAdmin } from "@/lib/supabase/admin";
import {
  VOTOS_PARA_APLICAR,
  cambiosVisibles,
  type CorreccionConCambios,
} from "@/lib/correcciones";

/**
 * Las correcciones que esperan aval, listas para la ficha de cada torneo.
 *
 * Van pegadas al torneo y no sólo en la cola aparte: el que puede decir si
 * una fecha está bien es el que estaba mirando ese torneo, y mandarlo a otra
 * página a buscarla es perderlo.
 */
export async function correccionesPorTorneo(
  torneos: { id: string }[],
  usuario: string | null,
): Promise<Map<string, CorreccionConCambios[]>> {
  const porTorneo = new Map<string, CorreccionConCambios[]>();
  if (torneos.length === 0) return porTorneo;

  const admin = crearClienteAdmin();
  const { data: pendientes } = await admin
    .from("correcciones")
    .select("id, fila_id, campos, motivo, propuesta_por")
    .eq("tabla", "torneos")
    .eq("situacion", "pendiente")
    .in("fila_id", torneos.map((t) => t.id));

  if (!pendientes?.length) return porTorneo;

  const [{ data: votos }, { data: salas }] = await Promise.all([
    admin
      .from("correcciones_votos")
      .select("correccion_id, usuario_id")
      .in("correccion_id", pendientes.map((c) => c.id)),
    admin.from("salas").select("id, nombre"),
  ]);

  const nombresDeSala = new Map((salas ?? []).map((s) => [s.id, s.nombre]));
  const porCorreccion = new Map<string, string[]>();
  for (const v of votos ?? []) {
    porCorreccion.set(v.correccion_id, [
      ...(porCorreccion.get(v.correccion_id) ?? []),
      v.usuario_id,
    ]);
  }

  const actuales = new Map(torneos.map((t) => [t.id, t as Record<string, unknown>]));

  for (const c of pendientes) {
    const votantes = porCorreccion.get(c.id) ?? [];
    const esMia = usuario !== null && c.propuesta_por === usuario;
    const yaAvale = usuario !== null && votantes.includes(usuario);

    porTorneo.set(c.fila_id, [
      ...(porTorneo.get(c.fila_id) ?? []),
      {
        id: c.id,
        motivo: c.motivo,
        avales: votantes.length,
        faltan: Math.max(0, VOTOS_PARA_APLICAR - votantes.length),
        esMia,
        yaAvale,
        puedeAvalar: usuario !== null && !esMia && !yaAvale,
        cambios: cambiosVisibles(
          c.campos as Record<string, unknown>,
          actuales.get(c.fila_id),
          nombresDeSala,
        ),
      },
    ]);
  }

  return porTorneo;
}


