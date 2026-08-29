-- Bucket de fotos de publicaciones.
-- Correr después de schema.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 3145728,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 3145728,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Las fotos se leen públicamente (el listado tiene que verse sin sesión),
-- pero cada usuario sólo escribe dentro de la carpeta que lleva su uid.

drop policy if exists fotos_lectura_publica on storage.objects;
create policy fotos_lectura_publica on storage.objects
  for select using (bucket_id = 'fotos');

drop policy if exists fotos_subir_propias on storage.objects;
create policy fotos_subir_propias on storage.objects
  for insert to authenticated with check (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists fotos_borrar_propias on storage.objects;
create policy fotos_borrar_propias on storage.objects
  for delete to authenticated using (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
  );
