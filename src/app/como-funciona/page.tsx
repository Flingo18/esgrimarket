import type { Metadata } from "next";
import Link from "next/link";

import { avalesNecesarios } from "@/lib/correcciones-servidor";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description:
    "Esgrimarket lo mantiene la comunidad de esgrima: las salas, los torneos y las correcciones los carga la gente que entrena. La administración sólo aprueba.",
};

function Paso({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0 size-8 rounded-full bg-acento-suave text-acento grid place-items-center font-semibold text-sm">
        {numero}
      </span>
      <div>
        <h3 className="font-medium">{titulo}</h3>
        <div className="mt-1 text-texto-suave space-y-2">{children}</div>
      </div>
    </li>
  );
}

export default async function PaginaComoFunciona() {
  const necesarios = await avalesNecesarios();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Cómo funciona</h1>
      <p className="mt-2 text-lg">
        Esgrimarket lo mantiene la comunidad. No hay nadie cargando el
        contenido de fondo: lo cargan los que entrenan.
      </p>

      <div className="mt-8 rounded-xl border border-acento/40 bg-acento-suave p-4">
        <p className="font-medium">Si falta algo, agregalo vos.</p>
        <p className="mt-1 text-sm">
          No hace falta pedir permiso ni avisarle a nadie. La administración
          del sitio <strong>no carga salas ni torneos</strong>: sólo aprueba lo
          que propone la gente.
        </p>
      </div>

      <ol className="mt-8 space-y-6">
        <Paso numero="1" titulo="Falta una sala en el mapa">
          <p>
            Entrá al{" "}
            <Link href="/mapa" className="text-acento underline">
              mapa
            </Link>{" "}
            y tocá <strong>“Agregar una sala”</strong>. Poné el nombre, la
            dirección y marcá dónde está. Queda pendiente y se publica cuando
            la aprueban.
          </p>
          <p>
            Podés cargar cualquier sala, no sólo la tuya. Si sabés que existe,
            alcanza.
          </p>
        </Paso>

        <Paso numero="2" titulo="Falta un torneo en el calendario">
          <p>
            Andá a{" "}
            <Link href="/torneos/proponer" className="text-acento underline">
              agregar un torneo
            </Link>
            . Copiá los datos de la circular o de la página de la federación:
            esto lo va a leer gente que arma un viaje con esa fecha.
          </p>
        </Paso>

        <Paso numero="3" titulo="Hay un dato mal cargado">
          <p>
            Abrí la ficha del torneo o el globo de la sala en el mapa y tocá{" "}
            <strong>“¿Falta un dato o está mal? Agregalo”</strong>. Ahí cambiás
            lo que esté mal y lo mandás.
          </p>
          <p>
            Si la cargaste vos, el cambio se guarda al instante. Si es de otro,
            queda propuesta y <strong>se aplica sola</strong> cuando{" "}
            {necesarios} personas más digan que está bien. No espera a
            ningún administrador: las fechas se reprograman y tienen que poder
            arreglarse rápido.
          </p>
          <p>
            Las correcciones esperando aval están en{" "}
            <Link href="/correcciones" className="text-acento underline">
              correcciones
            </Link>
            . Si sabés que una está bien, avalala: es un click y ayuda a que el
            calendario esté al día.
          </p>
        </Paso>

        <Paso numero="4" titulo="Querés vender o comprar equipamiento">
          <p>
            Publicá lo que no uses. El contacto es directo por WhatsApp, sin
            intermediarios y sin comisión. Hasta cinco publicaciones activas
            son gratis.
          </p>
        </Paso>
      </ol>

      <section className="mt-10 border-t border-borde pt-6">
        <h2 className="font-semibold">Qué hace la administración</h2>
        <p className="mt-2 text-texto-suave">
          Aprueba o rechaza lo que se propone, y nada más. No carga salas, no
          carga torneos y no corrige fechas. Es a propósito: un sitio que
          depende de una sola persona para estar al día queda desactualizado la
          primera semana que esa persona está ocupada.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">Qué no somos</h2>
        <p className="mt-2 text-texto-suave">
          Esgrimarket no es una federación ni tiene relación con ninguna. El
          calendario es una guía para que enterarse de un torneo sea fácil; lo
          oficial siempre es lo que dice la federación que organiza. Antes de
          viajar o de pagar una inscripción, confirmalo en su página.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link
          href="/salas/proponer"
          className="rounded-lg bg-acento text-acento-texto font-medium px-4 py-2 hover:opacity-90"
        >
          Agregar una sala
        </Link>
        <Link
          href="/torneos/proponer"
          className="rounded-lg bg-acento text-acento-texto font-medium px-4 py-2 hover:opacity-90"
        >
          Agregar un torneo
        </Link>
      </div>
    </div>
  );
}
