/**
 * Carga las salas de src/data/salas.ts en la base.
 *
 * Usa la service role key porque la tabla `salas` es de sólo lectura para
 * los usuarios: nadie puede agregar ni mover una sala desde la app.
 *
 *   node supabase/seed-salas.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const aca = dirname(fileURLToPath(import.meta.url));

// Lee .env.local sin dependencias extra.
for (const linea of readFileSync(resolve(aca, "../.env.local"), "utf8").split("\n")) {
  const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}

const { SALAS } = await import("../src/data/salas.ts");

if (SALAS.length === 0) {
  console.log("No hay salas cargadas todavía en src/data/salas.ts.");
  process.exit(0);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

for (const sala of SALAS) {
  const { data: existente } = await db
    .from("salas").select("id").eq("nombre", sala.nombre).maybeSingle();

  const fila = {
    nombre: sala.nombre,
    direccion: sala.direccion,
    barrio: sala.barrio,
    lat: sala.lat,
    lng: sala.lng,
    telefono: sala.telefono ?? null,
    sitio_web: sala.sitioWeb ?? null,
    instagram: sala.instagram ?? null,
    activa: true,
  };

  const { error } = existente
    ? await db.from("salas").update(fila).eq("id", existente.id)
    : await db.from("salas").insert(fila);

  console.log(error ? `✗ ${sala.nombre}: ${error.message}` : `✓ ${sala.nombre}`);
}
