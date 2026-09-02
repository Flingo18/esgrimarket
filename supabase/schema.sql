-- ════════════════════════════════════════════════════════════════════
--  Esgrimarket — esquema completo
--  Correr en Supabase → SQL Editor. Es idempotente.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─────────────────────────────── Perfiles ───────────────────────────
-- Extiende auth.users. El teléfono vive acá y NUNCA se expone en un
-- select: se entrega de a uno por la función contacto_whatsapp().

create table if not exists perfiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  nombre            text not null default '',
  telefono_e164     text,
  telefono_visible  text,
  sala_id           uuid,
  es_admin          boolean not null default false,

  -- Modelo de negocio: gratis hasta 5 publicaciones ACTIVAS. El que revende
  -- y quiere más, paga. Se sube a mano hasta que haya volumen suficiente
  -- para justificar automatizar el cobro.
  limite_publicaciones smallint not null default 5 check (limite_publicaciones > 0),
  -- Hasta cuándo rige el límite ampliado. Si vence, vuelve solo al gratuito.
  limite_hasta      timestamptz,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

-- ──────────────────────────────── Salas ─────────────────────────────
-- Ubicación exacta y pública: son instituciones, no domicilios.
-- Se cargan a mano desde el service role; nadie las edita desde la app.

create table if not exists salas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  direccion   text,
  barrio      text,
  -- Pueden faltar: una sala sin dirección exacta se lista igual, pero no se
  -- dibuja en el mapa. Mejor eso que una chinche inventada.
  lat         double precision,
  lng         double precision,
  telefono    text,
  sitio_web   text,
  instagram   text,
  activa      boolean not null default true,
  -- La comunidad puede proponer salas; no salen al mapa hasta aprobarlas.
  situacion   text not null default 'aprobada'
              check (situacion in ('pendiente', 'aprobada', 'rechazada')),
  propuesta_por uuid references auth.users(id) on delete set null,
  zona        text,
  nota        text,
  creado_en   timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table perfiles
  drop constraint if exists perfiles_sala_id_fkey;
alter table perfiles
  add constraint perfiles_sala_id_fkey
  foreign key (sala_id) references salas(id) on delete set null;

-- ───────────────────────────── Publicaciones ────────────────────────

create table if not exists publicaciones (
  id            uuid primary key default gen_random_uuid(),
  autor_id      uuid not null references auth.users(id) on delete cascade,

  titulo        text not null check (char_length(titulo) between 3 and 90),
  descripcion   text not null default '' check (char_length(descripcion) <= 2000),

  categoria     text not null check (categoria in
                  ('armas','ropa','electronica','accesorios')),

  -- Tipo de ítem dentro de la categoría (hoja, lame, cable_careta, bolso...).
  -- Se valida contra src/lib/taxonomy.ts, no acá: la taxonomía va a cambiar
  -- más seguido que el esquema y no quiero una migración por cada ajuste.
  tipo          text not null,

  -- Conjunto, no valor único: la chaqueta blanca sirve para las tres armas
  -- y el lamé de sable para una sola. Con un solo valor no se puede expresar.
  armas_compatibles text[] not null default '{}'
                  check (armas_compatibles <@ array['florete','espada','sable']),

  -- Reemplaza al viejo "montaje": un arma eléctrica, un lamé y un cable son
  -- todos parte del mismo equipo eléctrico, no hacen falta dos conceptos.
  es_electrica  boolean,

  empunadura    text check (empunadura in ('francesa','pistola','otra')),
  talle         text,
  nivel_proteccion text check (nivel_proteccion in
                    ('n800','n350','sin_certificar','no_aplica')),
  mano          text check (mano in ('diestro','zurdo','indistinto')),

  marca         text,
  -- Importa sobre todo en ropa: la tela pierde resistencia con los años.
  anio          smallint check (anio between 1970 and 2100),

  estado        text not null check (estado in
                  ('nuevo','usado_excelente','usado_bueno','usado_repuestos')),

  -- Precio: se guarda tal cual lo escribió el vendedor. La conversión a la
  -- otra moneda se calcula al mostrar, nunca se persiste.
  moneda_base   text not null check (moneda_base in ('USD','ARS')),
  monto         numeric(12,2) not null check (monto > 0),

  -- Ubicación. lat/lng ya vienen difuminados desde la app: el punto exacto
  -- no llega nunca a la base.
  zona          text not null,
  barrio        text,
  lat_aprox     double precision,
  lng_aprox     double precision,
  sala_entrega_id uuid references salas(id) on delete set null,

  situacion     text not null default 'activa'
                  check (situacion in ('activa','vendida','pausada','vencida')),

  -- Publicación de la tienda propia. Sólo la puede marcar un admin: es el
  -- canal por el que Felipe vende sus medias estampadas.
  es_oficial    boolean not null default false,

  -- Sin vencimiento, a los seis meses la página es un cementerio de
  -- publicaciones vendidas que nadie marcó.
  vence_en      timestamptz not null default now() + interval '45 days',
  contactos     integer not null default 0,

  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  busqueda tsvector generated always as (
    to_tsvector('spanish',
      coalesce(titulo,'') || ' ' || coalesce(descripcion,'') || ' ' || coalesce(marca,''))
  ) stored
);

create index if not exists idx_pub_visibles
  on publicaciones (creado_en desc)
  where situacion = 'activa';
create index if not exists idx_pub_categoria on publicaciones (categoria, tipo);
create index if not exists idx_pub_armas     on publicaciones using gin (armas_compatibles);
create index if not exists idx_pub_mano      on publicaciones (mano);
create index if not exists idx_pub_zona      on publicaciones (zona);
create index if not exists idx_pub_autor     on publicaciones (autor_id);
create index if not exists idx_fotos_publicacion on fotos (publicacion_id);
create index if not exists idx_pub_oficial   on publicaciones (es_oficial) where es_oficial;
create index if not exists idx_pub_busqueda  on publicaciones using gin (busqueda);

-- ────────────────────────────── Fotos ───────────────────────────────

create table if not exists fotos (
  id              uuid primary key default gen_random_uuid(),
  publicacion_id  uuid not null references publicaciones(id) on delete cascade,
  path            text not null,
  orden           smallint not null default 0,
  creado_en       timestamptz not null default now()
);

create index if not exists idx_fotos_pub on fotos (publicacion_id, orden);

-- ───────────────────────────── Reportes ─────────────────────────────

create table if not exists reportes (
  id              uuid primary key default gen_random_uuid(),
  publicacion_id  uuid not null references publicaciones(id) on delete cascade,
  reportante_id   uuid references auth.users(id) on delete set null,
  motivo          text not null,
  creado_en       timestamptz not null default now()
);

-- ──────────────────── Respaldo de cotización ────────────────────────
-- Última red de seguridad si las dos APIs de cotización se caen.

create table if not exists cotizacion_cache (
  id            boolean primary key default true check (id),
  venta         numeric(12,2) not null,
  fuente        text not null,
  actualizado   timestamptz not null default now()
);

-- ─────────────────────────────── Torneos ────────────────────────────

-- Calendario de la comunidad. Las fechas se reprograman seguido, así que
-- `actualizado_en` no es metadato: se muestra en la ficha, y es lo que
-- permite decidir si confiar en lo que dice.
create table if not exists torneos (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null check (char_length(nombre) between 3 and 140),

  -- Lo organiza una federación de la lista cerrada, o un club del mapa.
  -- Nunca las dos cosas, nunca ninguna.
  organizador_tipo     text not null default 'federacion'
                       check (organizador_tipo in ('federacion', 'club')),
  federacion           text,
  sala_id              uuid references salas(id) on delete set null,

  fecha_inicio         date,
  fecha_fin            date,
  cierre_inscripcion   date,
  lugar                text,
  zona                 text,
  -- Un link, un mail o un teléfono: la interfaz decide qué botón mostrar.
  contacto_inscripcion text,
  notas                text,

  -- Arreglo porque casi todas las fechas corren varias armas el mismo fin de
  -- semana. Vacío es "no está cargado", no "ninguna": filtrar por arma no
  -- tiene que esconder los que todavía nadie completó como si no aplicaran.
  armas                text[] not null default '{}'
                       constraint torneos_armas_validas
                       check (armas <@ array['florete', 'espada', 'sable']),

  situacion            text not null default 'pendiente'
                       check (situacion in ('pendiente', 'aprobado', 'rechazado')),
  propuesto_por        uuid references auth.users(id) on delete set null,
  creado_en            timestamptz not null default now(),
  actualizado_en       timestamptz not null default now(),

  constraint torneos_fechas_coherentes
    check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio),
  constraint torneos_organizador_coherente
    check ((organizador_tipo = 'federacion' and sala_id is null)
        or (organizador_tipo = 'club' and federacion is null))
);

-- ────────────────────── Avisos de torneos ───────────────────────────
--
-- "Avisame cuando haya un torneo de espada". Mismo mecanismo que las
-- búsquedas guardadas de productos.
--
-- Un arreglo vacío significa "cualquiera": quien quiere enterarse de todo no
-- tiene que tildar las tres armas. Y es una fila por persona — dos le
-- mandarían dos mails por el mismo torneo.
create table if not exists avisos_torneos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  armas       text[] not null default '{}'
              constraint avisos_armas_validas
              check (armas <@ array['florete', 'espada', 'sable']),
  categorias  uuid[] not null default '{}',
  activo      boolean not null default true,
  avisos      integer not null default 0,
  creado_en   timestamptz not null default now(),

  unique (usuario_id)
);

-- ─────────────────────────── Categorías ─────────────────────────────
--
-- Cada federación arma las suyas y no coinciden: lo que la FAE llama
-- "Infantiles sub 13" en la FECBA es "Infantiles (U13)", y la FECBA tiene un
-- "Promocional" que en la FAE no existe. Por eso la categoría pertenece a una
-- federación y no hay una lista única.
--
-- Las edita sólo el admin, y quedan fuera del sistema de correcciones por
-- votación: son la lista contra la que se cargan los torneos, así que si
-- cambiaran solas cambiaría el significado de todo lo ya cargado.
create table if not exists categorias (
  id          uuid primary key default gen_random_uuid(),
  federacion  text not null,
  nombre      text not null check (char_length(nombre) between 2 and 60),
  -- Para explicar de qué se trata, no para validar: cada torneo aclara en su
  -- circular cómo se cuenta la edad ese año.
  edad_desde  smallint check (edad_desde is null or edad_desde between 0 and 120),
  edad_hasta  smallint check (edad_hasta is null or edad_hasta between 0 and 120),
  activa      boolean not null default true,
  creado_en   timestamptz not null default now(),

  unique (federacion, nombre),
  constraint edades_coherentes
    check (edad_desde is null or edad_hasta is null or edad_hasta >= edad_desde)
);

create table if not exists torneos_categorias (
  torneo_id    uuid not null references torneos(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  primary key (torneo_id, categoria_id)
);

create index if not exists idx_torneos_categorias_categoria
  on torneos_categorias (categoria_id);

-- ───────────────────────── Correcciones ─────────────────────────────
--
-- Quien cargó una entrada la edita directo. Cualquier otro propone una
-- corrección, y con tres avales se aplica sola. Es lo que evita que cada
-- fecha reprogramada tenga que pasar por el admin.
--
-- El detalle de las funciones y el trigger vive en las migraciones
-- `correcciones_de_la_comunidad` y `correccion_no_rompe_el_voto`.

create table if not exists correcciones (
  id            uuid primary key default gen_random_uuid(),
  tabla         text not null check (tabla in ('torneos', 'salas')),
  fila_id       uuid not null,
  -- Sólo lo que cambia. Una clave presente en null borra el dato; una clave
  -- ausente lo deja como está.
  campos        jsonb not null,
  motivo        text,
  propuesta_por uuid not null references auth.users(id) on delete cascade,
  situacion     text not null default 'pendiente'
                check (situacion in ('pendiente', 'aplicada', 'rechazada')),
  -- Por qué no se pudo aplicar, cuando chocó contra una regla de la tabla.
  nota_sistema  text,
  creado_en     timestamptz not null default now(),
  resuelto_en   timestamptz,

  constraint correccion_no_vacia
    check (jsonb_typeof(campos) = 'object' and campos <> '{}'::jsonb),
  -- Sin esta lista blanca una corrección podría pisar `situacion` y
  -- aprobarse sola.
  constraint correccion_campos_permitidos
    check (correccion_campos_validos(tabla, campos))
);

create table if not exists correcciones_votos (
  correccion_id uuid not null references correcciones(id) on delete cascade,
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  creado_en     timestamptz not null default now(),
  primary key (correccion_id, usuario_id)
);

-- ════════════════════════════ Triggers ══════════════════════════════

create or replace function tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end $$;

drop trigger if exists trg_pub_actualizado on publicaciones;
create trigger trg_pub_actualizado before update on publicaciones
  for each row execute function tocar_actualizado_en();

drop trigger if exists trg_perfil_actualizado on perfiles;
create trigger trg_perfil_actualizado before update on perfiles
  for each row execute function tocar_actualizado_en();

drop trigger if exists trg_torneo_actualizado on torneos;
create trigger trg_torneo_actualizado before update on torneos
  for each row execute function tocar_actualizado_en();

drop trigger if exists trg_sala_actualizada on salas;
create trigger trg_sala_actualizada before update on salas
  for each row execute function tocar_actualizado_en();

-- Aplica la corrección apenas junta los avales necesarios.
drop trigger if exists trg_correccion_votada on correcciones_votos;
create trigger trg_correccion_votada after insert on correcciones_votos
  for each row execute function evaluar_correccion();

-- Crea el perfil apenas se registra el usuario, así nunca hay una sesión
-- activa sin fila en perfiles.
create or replace function crear_perfil_para_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_nuevo_usuario on auth.users;
create trigger trg_nuevo_usuario after insert on auth.users
  for each row execute function crear_perfil_para_usuario();

-- ══════════════════════════ Contacto WhatsApp ═══════════════════════
-- El teléfono se entrega de a uno y sólo para publicaciones activas.
-- Sin esto, un select a perfiles se llevaría el padrón telefónico entero
-- de la comunidad de esgrima.

create or replace function contacto_whatsapp(pub_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  tel text;
begin
  select p.telefono_e164 into tel
  from publicaciones pub
  join perfiles p on p.id = pub.autor_id
  where pub.id = pub_id
    and pub.situacion = 'activa'
    and pub.vence_en > now();

  if tel is null then
    return null;
  end if;

  update publicaciones set contactos = contactos + 1 where id = pub_id;
  return tel;
end $$;

revoke all on function contacto_whatsapp(uuid) from public;
grant execute on function contacto_whatsapp(uuid) to anon, authenticated;

-- ═══════════════════════════════ Admin ══════════════════════════════
-- SECURITY DEFINER a propósito: si la política de `perfiles` consultara
-- `perfiles` para saber si sos admin, sería recursiva y Postgres la rechaza.

create or replace function es_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select es_admin from perfiles where id = auth.uid()), false);
$$;

revoke all on function es_admin() from public;
grant execute on function es_admin() to authenticated;

-- ═══════════════════════════════ RLS ════════════════════════════════
-- Dos líneas por tabla. Es la única seguridad que necesita el proyecto,
-- y sin ella cualquiera con la clave pública borra publicaciones ajenas.

alter table perfiles          enable row level security;
alter table salas             enable row level security;
alter table publicaciones     enable row level security;
alter table fotos             enable row level security;
alter table reportes          enable row level security;
alter table cotizacion_cache  enable row level security;

-- Perfiles: cada uno ve y edita solamente el suyo.
drop policy if exists perfiles_leer_propio on perfiles;
create policy perfiles_leer_propio on perfiles
  for select using (auth.uid() = id);

drop policy if exists perfiles_editar_propio on perfiles;
create policy perfiles_editar_propio on perfiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Salas: lectura pública, escritura sólo desde el service role.
drop policy if exists salas_lectura_publica on salas;
create policy salas_lectura_publica on salas
  for select using (activa);

-- Publicaciones: las activas y no vencidas las ve cualquiera; las propias
-- las ve siempre su autor, en cualquier situación.
drop policy if exists pub_lectura_publica on publicaciones;
-- SECURITY DEFINER a propósito: `fotos_lectura` mira `publicaciones`, y si la
-- política de `publicaciones` mirara `fotos` con los permisos de quien
-- consulta, las dos se llamarían entre sí. La función corta ese círculo.
--
-- No puede ser un CHECK de tabla: la fila de la publicación se crea antes que
-- las de fotos, así que en ese instante siempre hay cero.
create or replace function tiene_foto(pub uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$ select exists (select 1 from fotos where publicacion_id = pub) $$;

create policy pub_lectura_publica on publicaciones
  for select to public
  using (
    (situacion = 'activa'
      and vence_en > now()
      and autor_activo(autor_id)
      -- Sin foto no se publica. La regla vive acá y no en el código para que
      -- no dependa de que cada consulta se acuerde de filtrar.
      and tiene_foto(id))
    -- El autor sigue viendo las suyas: si no, no tendría cómo darse cuenta
    -- de que le falta la foto ni cómo agregarla.
    or auth.uid() = autor_id
  );

-- El `es_oficial` reservado para admins es lo que impide que cualquiera
-- publique en la tienda propia.
drop policy if exists pub_crear_propia on publicaciones;
create policy pub_crear_propia on publicaciones
  for insert to authenticated
  with check (auth.uid() = autor_id and (not es_oficial or es_admin()));

drop policy if exists pub_editar_propia on publicaciones;
create policy pub_editar_propia on publicaciones
  for update to authenticated
  using (auth.uid() = autor_id)
  with check (auth.uid() = autor_id and (not es_oficial or es_admin()));

-- Moderación: el admin puede bajar o editar cualquier publicación.
drop policy if exists pub_moderar_admin on publicaciones;
create policy pub_moderar_admin on publicaciones
  for update to authenticated using (es_admin()) with check (es_admin());

drop policy if exists pub_borrar_admin on publicaciones;
create policy pub_borrar_admin on publicaciones
  for delete to authenticated using (es_admin());

-- El admin ve todo, incluso lo pausado y lo vencido.
drop policy if exists pub_lectura_admin on publicaciones;
create policy pub_lectura_admin on publicaciones
  for select to authenticated using (es_admin());

drop policy if exists pub_borrar_propia on publicaciones;
create policy pub_borrar_propia on publicaciones
  for delete to authenticated using (auth.uid() = autor_id);

-- Fotos: heredan la visibilidad de su publicación.
drop policy if exists fotos_lectura on fotos;
create policy fotos_lectura on fotos
  for select using (
    exists (
      select 1 from publicaciones p
      where p.id = fotos.publicacion_id
        and ((p.situacion = 'activa' and p.vence_en > now()) or auth.uid() = p.autor_id)
    )
  );

drop policy if exists fotos_escritura_propia on fotos;
create policy fotos_escritura_propia on fotos
  for all to authenticated
  using (
    exists (select 1 from publicaciones p
            where p.id = fotos.publicacion_id and p.autor_id = auth.uid())
  )
  with check (
    exists (select 1 from publicaciones p
            where p.id = fotos.publicacion_id and p.autor_id = auth.uid())
  );

-- Reportes: cualquiera con sesión reporta, nadie los lee salvo el admin
-- (que entra por el service role).
drop policy if exists reportes_crear on reportes;
create policy reportes_crear on reportes
  for insert to authenticated with check (true);

drop policy if exists reportes_leer_admin on reportes;
create policy reportes_leer_admin on reportes
  for select to authenticated using (es_admin());

-- Cotización: lectura pública, la escribe el cron con el service role.
drop policy if exists cotizacion_lectura on cotizacion_cache;
create policy cotizacion_lectura on cotizacion_cache
  for select using (true);

-- ═══════════════════ Límite de publicaciones ════════════════════════

/** Límite del plan gratuito. */
create or replace function limite_gratuito() returns integer
language sql immutable as $$ select 5 $$;

/**
 * Límite vigente de un usuario. Si el plan pago venció, vuelve solo al
 * gratuito: no hace falta un job que degrade cuentas.
 */
create or replace function limite_efectivo(usuario uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select case
    when p.limite_hasta is null or p.limite_hasta > now() then p.limite_publicaciones
    else limite_gratuito()
  end
  from perfiles p where p.id = usuario;
$$;

/**
 * Bloquea publicar de más. Va en un trigger y no en una política RLS para
 * poder devolver un mensaje que explique qué pasó: un `permission denied`
 * pelado no le dice nada a nadie.
 *
 * Cuenta sólo lo ACTIVO. Marcar algo como vendido libera un lugar, que es
 * justamente el incentivo que hace falta para que el catálogo no se llene
 * de cosas que ya no están.
 */
create or replace function chequear_limite_publicaciones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  activas integer;
  limite  integer;
begin
  -- Sólo interesa cuando la publicación pasa a ocupar un lugar.
  if new.situacion <> 'activa' then
    return new;
  end if;

  -- La tienda propia y la moderación no cuentan contra el límite.
  if new.es_oficial or es_admin() then
    return new;
  end if;

  limite := coalesce(limite_efectivo(new.autor_id), limite_gratuito());

  select count(*) into activas
  from publicaciones
  where autor_id = new.autor_id
    and situacion = 'activa'
    and vence_en > now()
    and not es_oficial
    and id <> new.id;   -- al editar, la fila propia no se cuenta dos veces

  if activas >= limite then
    raise exception
      'Llegaste a % publicaciones activas, que es el máximo de tu cuenta. Marcá alguna como vendida para liberar lugar.',
      limite
      using errcode = 'P0001';
  end if;

  return new;
end $$;

drop trigger if exists trg_limite_publicaciones on publicaciones;
create trigger trg_limite_publicaciones
  before insert or update of situacion on publicaciones
  for each row execute function chequear_limite_publicaciones();

-- ════════════════════════ Vencimiento ═══════════════════════════════
-- La llama el cron diario. Marca vencido lo que pasó la fecha.

create or replace function vencer_publicaciones()
returns integer language plpgsql security definer set search_path = public as $$
declare afectadas integer;
begin
  update publicaciones set situacion = 'vencida'
  where situacion = 'activa' and vence_en <= now();
  get diagnostics afectadas = row_count;
  return afectadas;
end $$;

-- ════════════════════════ Alta del admin ════════════════════════════
-- Correr UNA vez, después de registrarte por primera vez en la app.
-- Reemplazar por tu mail:
--
--   update perfiles set es_admin = true
--   where id = (select id from auth.users where email = 'felipe.saucedo@gmail.com');

-- ══════════════════ Ampliar el plan de un vendedor ══════════════════
-- Mientras el cobro sea manual (alguien te transfiere y le subís el cupo):
--
--   update perfiles
--   set limite_publicaciones = 50,
--       limite_hasta = now() + interval '1 month'
--   where id = (select id from auth.users where email = 'vendedor@mail.com');
--
-- Cuando `limite_hasta` pasa, el cupo vuelve solo a 5. No hay que acordarse
-- de dar de baja a nadie.
