import { FEDERACIONES, SITIO_FEDERACION } from "@/lib/torneos";

/**
 * De dónde salen estas fechas.
 *
 * Va donde se miran los torneos y no escondido en una página de términos:
 * alguien que viaja a otra provincia a competir tiene que enterarse acá de
 * que esto lo carga la comunidad y no la federación, antes de comprar el
 * pasaje. La página es una guía para que sea más fácil enterarse, nada más.
 */
export function AvisoTorneos({ compacto = false }: { compacto?: boolean }) {
  if (compacto) {
    return (
      <p className="text-xs text-texto-suave">
        Fecha cargada por la comunidad, no por la federación. Confirmala en la
        página oficial antes de viajar o de pagar la inscripción.
      </p>
    );
  }

  const conSitio = Object.entries(SITIO_FEDERACION);

  return (
    <aside className="mt-6 rounded-xl border border-borde bg-fondo-sutil p-4 text-sm text-texto-suave">
      <p>
        <strong className="text-texto">Esgrimarket no es una federación</strong>{" "}
        ni tiene relación con ninguna. Este calendario lo cargan y lo corrigen
        los propios esgrimistas, así que puede tener errores o quedar
        desactualizado. Antes de viajar o de pagar una inscripción, confirmá
        siempre en la página oficial de quien organiza.
      </p>
      {conSitio.length > 0 && (
        <p className="mt-2">
          Páginas oficiales:{" "}
          {conSitio.map(([id, url], i) => (
            <span key={id}>
              {i > 0 && " · "}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-acento underline"
              >
                {FEDERACIONES[id as keyof typeof FEDERACIONES] ?? id}
              </a>
            </span>
          ))}
        </p>
      )}
      <p className="mt-2">
        La idea es que enterarse de un torneo sea fácil y que el deporte crezca.
        Si ves algo mal, corregilo: no hace falta permiso de nadie.
      </p>
    </aside>
  );
}
