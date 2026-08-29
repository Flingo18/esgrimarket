/**
 * Normalización de teléfonos argentinos para links de WhatsApp.
 *
 * Es la fuente de bugs más previsible del proyecto: la gente escribe el número
 * de seis maneras distintas ("11 1234-5678", "011 15 1234 5678",
 * "+54 9 11 1234-5678") y wa.me sólo acepta una: 54 9 <área> <número>,
 * sin el 0 inicial y sin el 15.
 *
 * Por eso el número se normaliza AL GUARDAR y se persiste ya canónico.
 */

/** Cantidad de dígitos de un número nacional argentino (área + abonado). */
const LARGO_NACIONAL = 10;

/**
 * Códigos de área de 3 dígitos. El 11 es de 2 y todo el resto es de 4.
 * Sólo se usa para partir el número al mostrarlo en pantalla.
 */
const AREAS_3_DIGITOS = new Set([
  "220", "221", "223", "230", "236", "237", "249", "260", "261", "263", "264",
  "266", "280", "291", "297", "299", "341", "342", "343", "345", "348", "351",
  "353", "358", "362", "364", "370", "376", "379", "380", "381", "383", "385",
  "387", "388",
]);

export type ResultadoTelefono =
  | { ok: true; e164: string; visible: string }
  | { ok: false; error: string };

/**
 * Devuelve el número en formato `549XXXXXXXXXX`, listo para wa.me.
 */
export function normalizarTelefono(entrada: string): ResultadoTelefono {
  let d = entrada.replace(/\D/g, "");

  if (!d) return { ok: false, error: "Ingresá un número de teléfono." };

  // Prefijo de salida internacional, si lo copiaron de la agenda.
  if (d.startsWith("00")) d = d.slice(2);

  // Código de país.
  if (d.startsWith("54")) d = d.slice(2);

  // El 9 de móvil: lo sacamos acá y lo volvemos a poner al final, así no
  // importa si el usuario lo escribió o no.
  if (d.length > LARGO_NACIONAL && d.startsWith("9")) d = d.slice(1);

  // 0 de larga distancia nacional.
  if (d.startsWith("0")) d = d.slice(1);

  // El "15" va después del código de área, que mide entre 2 y 4 dígitos.
  // Como no sabemos cuánto mide, probamos las posiciones posibles y nos
  // quedamos con la que deja un número de largo válido.
  if (d.length > LARGO_NACIONAL) {
    for (const i of [2, 3, 4]) {
      if (d.slice(i, i + 2) === "15" && d.length - 2 === LARGO_NACIONAL) {
        d = d.slice(0, i) + d.slice(i + 2);
        break;
      }
    }
  }

  // "15 1234-5678": número porteño escrito sin código de área. El 15 no es un
  // código de área válido en ningún lado del país, así que si quedó adelante
  // es porque falta el 11. El formulario muestra el número ya interpretado
  // para que el usuario lo confirme.
  if (d.length === LARGO_NACIONAL && d.startsWith("15")) {
    d = `11${d.slice(2)}`;
  }

  if (d.length < LARGO_NACIONAL) {
    return { ok: false, error: "El número es muy corto. Incluí el código de área sin el 0." };
  }
  if (d.length > LARGO_NACIONAL) {
    return { ok: false, error: "El número es muy largo. Escribilo sin el 0 ni el 15." };
  }

  return { ok: true, e164: `549${d}`, visible: formatearVisible(d) };
}

/** Formato legible para mostrar en pantalla: "11 1234-5678". */
function formatearVisible(nacional: string): string {
  const area = largoCodigoArea(nacional);
  const cod = nacional.slice(0, area);
  const resto = nacional.slice(area);
  const mitad = Math.ceil(resto.length / 2);
  return `${cod} ${resto.slice(0, mitad)}-${resto.slice(mitad)}`;
}

function largoCodigoArea(nacional: string): number {
  if (nacional.startsWith("11")) return 2;
  if (AREAS_3_DIGITOS.has(nacional.slice(0, 3))) return 3;
  return 4;
}

/**
 * Link de WhatsApp con el mensaje ya escrito. Que el comprador no tenga que
 * redactar nada sube muchísimo la tasa de contacto.
 */
export function linkWhatsApp(e164: string, tituloPublicacion: string, url?: string): string {
  const partes = [
    `¡Hola! Vi tu publicación de "${tituloPublicacion}" en Esgrimarket.`,
    url ? `\n${url}` : "",
    "\n¿Sigue disponible?",
  ];
  return `https://wa.me/${e164}?text=${encodeURIComponent(partes.join(""))}`;
}
