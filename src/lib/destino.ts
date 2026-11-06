/**
 * A dónde mandar a alguien después de que entra, sin que el parámetro pueda
 * sacarlo del sitio.
 *
 * Un `next` que apunte afuera convierte el login en un trampolín de phishing:
 * la persona entra por esgrimarket.com.ar, con su candado y todo, y termina
 * recién autenticada en una copia del sitio pidiéndole datos. El momento es
 * el peor posible, porque acaba de demostrarse a sí misma que el link era
 * legítimo.
 *
 * Se descartan tabs y saltos de línea antes de mirar nada: los navegadores
 * los borran al parsear una URL, así que `/<tab>/evil.com` pasa cualquier
 * chequeo de prefijo y llega al navegador convertido en `//evil.com`, que es
 * protocolo-relativo y sale del dominio.
 */
export function destinoSeguro(valor: unknown): string {
  const crudo = typeof valor === "string" ? valor : "";
  const v = crudo.replace(/[\t\n\r]/g, "");

  // Tiene que ser una ruta de este sitio: una sola barra, y nada que el
  // navegador pueda leer como host o como esquema.
  if (!v.startsWith("/")) return "/";
  if (v.startsWith("//") || v.startsWith("/\\")) return "/";

  return v;
}
