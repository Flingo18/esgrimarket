/**
 * A qué dominios puede mandar el botón de contacto de una publicación.
 *
 * Es una lista blanca y no una validación de formato, porque cualquier
 * `https://` bien escrito sirve igual para una estafa. El valor vive en una
 * columna de la base, así que una policy mal escrita, un token filtrado o un
 * error de migración alcanzarían para que el botón empiece a mandar gente a
 * cualquier lado con el aval de nuestro dominio.
 *
 * Por eso se evalúa en el momento de redirigir y no sólo al guardar: aunque
 * alguien consiga escribir la fila por fuera de la aplicación, el redirect no
 * la honra y la persona termina en la ficha, no en el sitio del atacante.
 *
 * Para habilitar otro formulario, agregá su host acá. Es a propósito que
 * requiera tocar el código: es la lista de lugares a los que decidimos
 * mandar a nuestra gente, y eso merece quedar escrito.
 */
const HOSTS_PERMITIDOS = ["esgrimanaval.fillout.com"];

/** El host, tal como hay que escribirlo para habilitarlo. */
export function hostDe(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function hostsPermitidos(): readonly string[] {
  return HOSTS_PERMITIDOS;
}

/**
 * Devuelve la URL sólo si se puede usar; `null` en cualquier otro caso.
 *
 * Quien la llama decide qué hacer con el `null`: al guardar es un error que
 * se le muestra a la persona, y al redirigir es volver al WhatsApp de siempre.
 */
export function contactoPermitido(url: string | null | undefined): string | null {
  if (typeof url !== "string" || !url) return null;

  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    return null;
  }

  if (destino.protocol !== "https:") return null;
  if (!HOSTS_PERMITIDOS.includes(destino.hostname)) return null;

  return url;
}
