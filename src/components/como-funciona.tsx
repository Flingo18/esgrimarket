import Link from "next/link";

/**
 * Quién carga el contenido.
 *
 * Existe por un motivo concreto: a quien administra el sitio le escriben para
 * pedirle que agregue salas y torneos, como si fuera él el que los carga. No
 * lo es. El que ve que falta algo es el que lo agrega, y la administración
 * sólo aprueba.
 *
 * Va arriba y no al pie, porque un aviso que hay que buscar no cambia lo que
 * hace la gente.
 */
export function ComoFunciona({ compacto = false }: { compacto?: boolean }) {
  if (compacto) {
    return (
      <p className="text-sm text-texto-suave">
        Esto lo carga la comunidad, no la administración. Si ves que falta algo,
        agregalo vos: se publica cuando lo aprueban.{" "}
        <Link href="/como-funciona" className="text-acento underline">
          Cómo funciona
        </Link>
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-acento/40 bg-acento-suave p-4">
      <h2 className="font-semibold">Esto lo mantiene la comunidad</h2>
      <p className="mt-1.5 text-sm">
        Las salas, los torneos y las fechas los carga la gente que entrena, no
        la administración del sitio. Si ves que falta tu sala o un torneo,{" "}
        <strong>agregalo vos</strong> — no hace falta pedirle permiso a nadie.
        La administración sólo aprueba lo que se propone; no carga contenido.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/salas/proponer"
          className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-3 py-1.5 hover:opacity-90"
        >
          Agregar una sala
        </Link>
        <Link
          href="/torneos/proponer"
          className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-3 py-1.5 hover:opacity-90"
        >
          Agregar un torneo
        </Link>
        <Link
          href="/como-funciona"
          className="rounded-lg border border-acento px-3 py-1.5 text-sm text-acento hover:bg-acento/10"
        >
          Cómo funciona
        </Link>
      </div>
    </section>
  );
}
