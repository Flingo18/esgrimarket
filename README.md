# Esgrimarket

Marketplace de equipamiento de esgrima para la comunidad de Buenos Aires.
Publicás, filtrás, y el contacto se hace por WhatsApp. Sin chat interno y sin pagos.

## Stack

- **Next.js 16** (App Router) en Vercel
- **Supabase** — Postgres, autenticación y storage de fotos
- **Leaflet + OpenStreetMap** para el mapa (sin API key ni tarjeta)

## En vivo

**https://esgrimarket.vercel.app**

Desplegado en Vercel desde `main`: cada push publica solo. Las variables de
entorno viven en Vercel (Settings → Environment Variables), no en el repo.

`NEXT_PUBLIC_SITE_URL` tiene que ser la URL de producción, no `localhost`: de
ella salen los links de los mails de login. Y esa misma URL tiene que estar
cargada en Supabase → Authentication → URL Configuration, o el login se rompe
sin dar ningún error visible.

## Estado

La base ya está creada y funcionando en el proyecto **Esgrimarket**
(`jnjtazjokhehvsjouxzy`, Postgres 17). Las migraciones están aplicadas, RLS
activo en las seis tablas y el bucket de fotos creado. `.env.local` ya tiene
la URL y la clave pública.

El esquema completo está versionado en `supabase/schema.sql` como referencia
legible; para cambiarlo de acá en más, aplicar migraciones nuevas y no editar
ese archivo esperando que se sincronice solo.

## Lo que falta configurar

### 1. La service role key

Supabase → Project Settings → API Keys → `service_role` (secret). Va en
`.env.local`, en `SUPABASE_SERVICE_ROLE_KEY`. La necesitan el seed de salas y
el cron. Nunca en una variable `NEXT_PUBLIC_`.

### 2. El envío de mails — antes de lanzar, no ahora

Hoy funciona con el servidor de fábrica de Supabase, que alcanza para
desarrollar. Tiene dos límites que lo hacen inviable para producción:

- Manda **unos pocos mails por hora** para todo el proyecto. Con tres personas
  registrándose en la misma hora, la tercera no recibe nada — y tampoco un
  error: simplemente no le llega.
- **No deja editar los templates.** Eso obliga al flujo por link, porque el
  template de fábrica manda un link y no el código de 6 dígitos.

Antes de abrirlo a la comunidad:

1. Cuenta en [resend.com](https://resend.com) (gratis: 100 mails/día)
2. Verificar el dominio propio
3. Supabase → Authentication → Emails → SMTP Settings
4. Subir el límite en Authentication → Rate Limits, que **no sube solo** al
   conectar el SMTP propio
5. Cambiar el template de Magic Link para que use `{{ .Token }}` y reactivar
   `validarCodigo` en `src/acciones/auth.ts`, que ya está escrita

### 3. Darte de alta como admin

Después de registrarte por primera vez en la app, en el SQL Editor:

```sql
update perfiles set es_admin = true
where id = (select id from auth.users where email = 'TU@MAIL.COM');
```

Habilita bajar publicaciones de cualquiera, leer los reportes, y marcar tus
publicaciones como `es_oficial` — el canal de la tienda propia, que además no
cuenta contra ningún límite.

### 4. Correr

```bash
npm run dev
```

## Verificado contra la base real

No son suposiciones: se probaron contra el proyecto y después se limpiaron
los datos de prueba.

- El perfil se crea solo al registrarse un usuario
- A la sexta publicación activa salta el límite con el mensaje correcto
- Marcar una como vendida libera el lugar
- Una categoría inventada y un arma inexistente son rechazadas
- La búsqueda full-text en español indexa y encuentra
- **Un visitante anónimo no puede leer ningún teléfono**, ni listando
  `perfiles` ni pidiendo la columna directamente
- Pero sí obtiene el link de WhatsApp por `contacto_whatsapp()`, y el
  contador de contactos se incrementa
- Un anónimo no puede borrar publicaciones ajenas ni llamar a
  `vencer_publicaciones()`

## Decisiones de diseño que conviene no revertir sin pensarlo

**Los precios no se reescriben.** Cada publicación guarda el monto en la moneda
que eligió el vendedor. La conversión se calcula al mostrar, con la cotización
del blue cacheada 30 minutos. No hay job nocturno que pueda dejar precios viejos.

**La ubicación exacta nunca llega a la base.** `src/lib/geo.ts` corre el punto a
una posición aleatoria dentro de 400 m y sólo se persiste el punto corrido. El
desplazamiento se calcula una vez, al guardar: hacerlo en cada lectura permitiría
recuperar el original promediando varias consultas.

**Los teléfonos no se exponen en ningún select.** Viven en `perfiles` con RLS de
"sólo tu propia fila". El link de WhatsApp se resuelve por la función
`contacto_whatsapp()`, que devuelve un número por vez, sólo para publicaciones
activas, y de paso cuenta el contacto. Sin esto, cualquiera se baja la agenda
telefónica entera de la comunidad.

**El teléfono se normaliza al guardar.** Argentina tiene seis formas de escribir
el mismo celular y wa.me acepta una sola. Ver `src/lib/whatsapp.ts`.

**El login es por link, pero no por gusto.** El código de 6 dígitos es mejor
—el link se abre en el navegador de la app de mail y la sesión puede quedar
iniciada en el lugar equivocado— pero el plan gratuito no deja editar el
template y el de fábrica manda un link. `validarCodigo` en
`src/acciones/auth.ts` está escrita y probada para cuando se pueda cambiar.
La ruta `/auth/confirmar` soporta el flujo por link y seguirá haciendo falta.

**Las publicaciones vencen a los 45 días.** Sin esto, en seis meses el catálogo
es mayormente cosas ya vendidas y la gente vuelve al grupo de WhatsApp.

**La taxonomía vive en un solo archivo.** `src/lib/taxonomy.ts` alimenta el
formulario, los filtros y la validación. Cada tipo de ítem trae su propia
metadata (con qué armas sirve, si lleva talle y en qué escala, si la mano
importa, si lleva certificación) y el formulario se arma leyéndola. Agregar
un atributo se hace ahí y nada más.

**Las armas compatibles son un conjunto, no un valor.** Una chaqueta blanca
sirve para las tres armas y un lamé de sable para una sola. Con un campo único
habría que elegir una y la chaqueta quedaría escondida para dos tercios de la
gente. Por eso `armas_compatibles` es un arreglo con índice GIN.

**La categoría no se valida en la base, sólo el nivel superior.** Las cuatro
categorías están en un `check`, pero el `tipo` dentro de cada una se valida
contra la taxonomía en TypeScript: va a cambiar más seguido que el esquema y
no vale la pena una migración por cada ajuste.

## Pendientes

- [ ] Cargar las salas en `src/data/salas.ts` y correr `node supabase/seed-salas.mjs`
- [x] Autenticación por mail
- [x] Listado con filtros por URL
- [x] Formulario de publicación
- [x] Página de detalle y contacto por WhatsApp
- [ ] Mapa de salas y zonas de retiro
- [ ] "Mis publicaciones" y botón de vendido
- [ ] Login con Google
- [ ] `og:image` dinámica — el crecimiento va a venir de links pegados en grupos de WhatsApp
- [ ] Panel de administración: bajar publicaciones y ver reportes
- [ ] Sección de tienda propia (`es_oficial`)
- [ ] Cron diario: `vencer_publicaciones()` y respaldo de cotización

### Más adelante

- Publicidad de salas y agenda de eventos (la tabla `salas` ya está)
- Cobro automatizado del plan ampliado — recién cuando haya vendedores pagando
- Ojo con el plan de Vercel el día que entre plata, ver abajo

## Modelo de negocio

Publicar es gratis hasta **5 publicaciones activas**, que alcanza de sobra para
alguien que vende lo que le quedó chico. El que revende y necesita más, paga.

El límite cuenta lo **activo**, no lo publicado históricamente: quien vendió
veinte cosas en un año no queda bloqueado por haber usado bien la app. Y tiene
un efecto de arrastre útil — marcar algo como vendido libera un lugar, que es
justo el incentivo que hacía falta para que el catálogo no se llene de
publicaciones de cosas que ya no están.

Se aplica en un trigger de Postgres, no en la interfaz, así que no se puede
esquivar armando el pedido a mano.

Mientras haya pocos vendedores grandes, el cobro es manual: te transfieren y
subís el cupo con el `update` que está comentado al final de `schema.sql`.
`limite_hasta` hace que el plan vuelva solo al gratuito cuando vence, así que
no hay que acordarse de dar de baja a nadie. Automatizar el pago para cero
clientes es trabajo tirado.

Un detalle a tener presente: un precio fijo en pesos se licúa. Conviene fijar
el plan en dólares y cobrar el equivalente — el módulo de cotización que ya
está (`src/lib/dolar.ts`) sirve igual para eso.

## Nota sobre el plan de Vercel

El plan Hobby es **sólo para uso no comercial**. El día que se cobre la comisión
del 1%, hay que pasar a Pro (USD 20/mes).
