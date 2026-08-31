/**
 * Normalización de teléfonos para links de WhatsApp.
 *
 * Es la fuente de bugs más previsible del proyecto: la gente escribe el número
 * de seis maneras distintas ("11 1234-5678", "011 15 1234 5678",
 * "+54 9 11 1234-5678") y wa.me sólo acepta una: 54 9 <área> <número>,
 * sin el 0 inicial y sin el 15.
 *
 * Por eso el número se normaliza AL GUARDAR y se persiste ya canónico.
 *
 * El default es Argentina, que es de donde viene casi todo el mundo, pero hay
 * esgrimistas afuera: el país se elige aparte del número.
 */

/**
 * Países disponibles. Los códigos telefónicos no se solapan entre sí — ninguno
 * es prefijo de otro — así que alcanza con el código para saber de dónde es un
 * número ya guardado, sin agregar una columna.
 *
 * Estados Unidos y Canadá comparten el +1 y por eso van juntos.
 */
export const PAISES = {
  AR: { nombre: "Argentina", codigo: "54", bandera: "🇦🇷" },
  UY: { nombre: "Uruguay", codigo: "598", bandera: "🇺🇾" },
  BR: { nombre: "Brasil", codigo: "55", bandera: "🇧🇷" },
  CL: { nombre: "Chile", codigo: "56", bandera: "🇨🇱" },
  PY: { nombre: "Paraguay", codigo: "595", bandera: "🇵🇾" },
  BO: { nombre: "Bolivia", codigo: "591", bandera: "🇧🇴" },
  PE: { nombre: "Perú", codigo: "51", bandera: "🇵🇪" },
  CO: { nombre: "Colombia", codigo: "57", bandera: "🇨🇴" },
  EC: { nombre: "Ecuador", codigo: "593", bandera: "🇪🇨" },
  VE: { nombre: "Venezuela", codigo: "58", bandera: "🇻🇪" },
  MX: { nombre: "México", codigo: "52", bandera: "🇲🇽" },
  US: { nombre: "Estados Unidos / Canadá", codigo: "1", bandera: "🇺🇸" },
  ES: { nombre: "España", codigo: "34", bandera: "🇪🇸" },
  IT: { nombre: "Italia", codigo: "39", bandera: "🇮🇹" },
  FR: { nombre: "Francia", codigo: "33", bandera: "🇫🇷" },
  DE: { nombre: "Alemania", codigo: "49", bandera: "🇩🇪" },
  GB: { nombre: "Reino Unido", codigo: "44", bandera: "🇬🇧" },
  PT: { nombre: "Portugal", codigo: "351", bandera: "🇵🇹" },
  PL: { nombre: "Polonia", codigo: "48", bandera: "🇵🇱" },
  HU: { nombre: "Hungría", codigo: "36", bandera: "🇭🇺" },
  RU: { nombre: "Rusia", codigo: "7", bandera: "🇷🇺" },
  IL: { nombre: "Israel", codigo: "972", bandera: "🇮🇱" },
  CN: { nombre: "China", codigo: "86", bandera: "🇨🇳" },
  JP: { nombre: "Japón", codigo: "81", bandera: "🇯🇵" },
  KR: { nombre: "Corea del Sur", codigo: "82", bandera: "🇰🇷" },
  AU: { nombre: "Australia", codigo: "61", bandera: "🇦🇺" },
} as const;

export type PaisId = keyof typeof PAISES;

export const PAIS_POR_DEFECTO: PaisId = "AR";

export function esPais(v: unknown): v is PaisId {
  return typeof v === "string" && v in PAISES;
}

/**
 * De qué país es un número ya normalizado.
 *
 * Sirve para que el formulario vuelva a abrirse con el país correcto sin
 * guardarlo aparte. El más largo primero, porque "54" y "598" empiezan igual
 * en el primer dígito y hay que quedarse con el match completo.
 */
export function paisDeE164(e164?: string | null): PaisId {
  if (!e164) return PAIS_POR_DEFECTO;
  const ordenados = (Object.keys(PAISES) as PaisId[]).sort(
    (a, b) => PAISES[b].codigo.length - PAISES[a].codigo.length,
  );
  return ordenados.find((p) => e164.startsWith(PAISES[p].codigo)) ?? PAIS_POR_DEFECTO;
}

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
 * Devuelve el número listo para wa.me: código de país y número, sin signos.
 */
export function normalizarTelefono(
  entrada: string,
  pais: PaisId = PAIS_POR_DEFECTO,
): ResultadoTelefono {
  if (pais !== "AR") return normalizarExtranjero(entrada, pais);

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

/**
 * Números de afuera.
 *
 * Acá no se adivina nada: se saca el código de país si lo escribieron y se
 * guarda el resto tal cual. La única regla que se aplica es el 0 de larga
 * distancia, que se marca por país porque Italia es la excepción conocida —
 * ahí el 0 es parte del número y sacarlo deja un teléfono que no existe.
 */
function normalizarExtranjero(entrada: string, pais: PaisId): ResultadoTelefono {
  const { codigo, nombre } = PAISES[pais];
  const limpio = entrada.trim();
  let d = limpio.replace(/\D/g, "");

  if (!d) return { ok: false, error: "Ingresá un número de teléfono." };

  // El código de país se saca sólo si lo escribieron como código de país: con
  // un "+" o un "00" adelante. Sin esa señal no se toca, porque hay números
  // que arrancan igual que su propio prefijo — un celular italiano puede ser
  // 391 234 5678, y recortarle el "39" deja un teléfono que no existe.
  const esInternacional = limpio.startsWith("+") || d.startsWith("00");
  if (d.startsWith("00")) d = d.slice(2);
  if (esInternacional && d.startsWith(codigo)) d = d.slice(codigo.length);

  // El 0 de larga distancia no se marca desde afuera. Italia es la excepción
  // conocida: ahí el 0 es parte del número.
  if (pais !== "IT" && d.startsWith("0")) d = d.slice(1);

  if (d.length < 6) {
    return { ok: false, error: `Ese número parece corto para ${nombre}.` };
  }
  // El máximo de un teléfono en el mundo son 15 dígitos contando el país.
  if (codigo.length + d.length > 15) {
    return { ok: false, error: `Ese número parece largo para ${nombre}.` };
  }

  const visible =
    d.length > 6 ? `+${codigo} ${d.slice(0, 3)} ${d.slice(3)}` : `+${codigo} ${d}`;

  return { ok: true, e164: `${codigo}${d}`, visible };
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
