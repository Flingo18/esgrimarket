import { RescatarDesdeElFragmento } from "./cliente";

/**
 * Último recurso cuando el link no trae nada en la query: los tokens del
 * flujo implícito viajan en el fragmento (`#access_token=...`), que el
 * navegador nunca manda al servidor.
 */
export default async function PaginaFragmento({
  searchParams,
}: PageProps<"/auth/fragmento">) {
  const { next } = await searchParams;
  return (
    <RescatarDesdeElFragmento destino={typeof next === "string" ? next : "/"} />
  );
}
