import type { Metadata } from "next";
import Link from "next/link";

import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dónde comprar equipamiento de esgrima en Argentina",
  description:
    "Qué necesitás para empezar esgrima, qué conviene comprar usado y qué no, y dónde conseguirlo en Argentina. Guía hecha por la comunidad.",
  alternates: { canonical: "/comprar-equipamiento-esgrima-argentina" },
};

/**
 * La página que contesta la pregunta tal como la escribe la gente.
 *
 * No repite el listado: contesta. Lo que la hace distinta de cualquier
 * tienda es que lo que aconseja sale del mapa y del catálogo reales, y que
 * dice también cuándo NO comprar acá.
 */

const PREGUNTAS = [
  {
    q: "¿Qué necesito para empezar esgrima?",
    r: "Para las primeras clases casi ninguna sala pide equipo: prestan careta, chaquetilla y arma. Lo primero que se compra suele ser el guante, después la careta y la chaquetilla, y el arma al final. Conviene esperar a saber con qué arma te vas a quedar antes de comprar nada caro.",
  },
  {
    q: "¿Conviene comprar equipamiento de esgrima usado?",
    r: "Para casi todo sí: chaquetillas, pantalones, petos, lamés y caretas duran años y se venden por cambio de talle más que por desgaste. Las hojas son la excepción — son consumibles, se fatigan y se parten, así que una hoja usada es una apuesta.",
  },
  {
    q: "¿Qué tengo que mirar antes de comprar una careta usada?",
    r: "La certificación y el estado de la malla. Las caretas se marcan como 800N (FIE), 350N o sin certificar, y muchos torneos exigen un mínimo. La malla no tiene que estar abollada ni oxidada, y el babero tiene que estar entero.",
  },
  {
    q: "¿La ropa de esgrima sirve para cualquier arma?",
    r: "La chaquetilla, el pantalón y la careta sirven para las tres. El lamé no: sólo se usa en florete y en sable, y el de florete cubre distinta superficie que el de sable, así que no son intercambiables.",
  },
  {
    q: "¿Importa si soy zurdo?",
    r: "Sí, en todo lo asimétrico: chaquetillas, lamés, guantes y empuñaduras vienen para diestro o para zurdo. Es el error más común comprando usado.",
  },
];

export default async function PaginaGuiaCompra() {
  const supabase = await crearClienteServidor();

  const [{ count: publicaciones }, { count: salas }] = await Promise.all([
    supabase
      .from("publicaciones")
      .select("id", { count: "exact", head: true })
      .eq("situacion", "activa"),
    supabase
      .from("salas")
      .select("id", { count: "exact", head: true })
      .eq("situacion", "aprobada")
      .eq("activa", true),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Los datos estructurados de preguntas son lo que puede hacer que
          Google muestre la respuesta directamente cuando alguien pregunta. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: PREGUNTAS.map((p) => ({
              "@type": "Question",
              name: p.q,
              acceptedAnswer: { "@type": "Answer", text: p.r },
            })),
          }),
        }}
      />

      <h1 className="text-2xl font-semibold tracking-tight">
        Dónde comprar equipamiento de esgrima en Argentina
      </h1>
      <p className="mt-3 text-texto-suave">
        No hay muchas opciones y conviene saber cuál sirve para qué. Esta guía
        la mantiene la comunidad de esgrima argentina.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Usado, entre esgrimistas</h2>
        <p className="mt-2 text-texto-suave">
          Es lo que hacemos acá. Hoy hay{" "}
          <strong className="text-texto">
            {publicaciones ?? 0} publicaciones
          </strong>{" "}
          de gente que entrena: caretas, chaquetillas, lamés, armas, cables y
          repuestos. El contacto es directo por WhatsApp, sin comisión y sin
          intermediarios — Esgrimarket no vende nada ni cobra nada.
        </p>
        <p className="mt-2 text-texto-suave">
          Sirve sobre todo para empezar sin gastar de más, y para el equipo que
          se queda chico: los chicos cambian de talle cada temporada y ese
          equipo está casi nuevo.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-lg bg-acento text-acento-texto font-medium px-4 py-2 hover:opacity-90"
        >
          Ver lo que hay publicado
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Nuevo</h2>
        <p className="mt-2 text-texto-suave">
          Para equipo nuevo hay casas especializadas, y muchos clubes hacen
          pedidos grupales al exterior una o dos veces al año, que sale mucho
          más barato que importar de a uno. Si estás empezando,{" "}
          <strong className="text-texto">preguntá en tu sala antes de comprar</strong>
          : suelen saber cuándo es el próximo pedido y qué marca anda bien.
        </p>
        <p className="mt-2 text-texto-suave">
          Hay{" "}
          <Link href="/mapa" className="text-acento underline">
            {salas ?? 0} salas cargadas en el mapa
          </Link>
          , con dirección y teléfono.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Qué conviene usado y qué no</h2>
        <div className="mt-3 space-y-3 text-texto-suave">
          <p>
            <strong className="text-texto">Sí:</strong> chaquetillas,
            pantalones, petos, lamés, guantes y caretas. Duran años y la
            mayoría se vende por cambio de talle, no por desgaste.
          </p>
          <p>
            <strong className="text-texto">Con cuidado:</strong> las caretas.
            Mirá la certificación —800N (FIE), 350N o sin certificar— porque
            muchos torneos exigen un mínimo, y revisá que la malla no esté
            abollada ni oxidada.
          </p>
          <p>
            <strong className="text-texto">No:</strong> las hojas. Son
            consumibles: se fatigan con el uso y se parten sin aviso. Una hoja
            usada barata puede durar dos entrenamientos.
          </p>
          <p>
            Y mirá siempre la mano: chaquetillas, lamés, guantes y empuñaduras
            vienen para diestro o para zurdo. Es el error más común.
          </p>
        </div>
      </section>

      <section className="mt-10 border-t border-borde pt-6">
        <h2 className="text-lg font-semibold">Preguntas frecuentes</h2>
        <dl className="mt-4 space-y-5">
          {PREGUNTAS.map((p) => (
            <div key={p.q}>
              <dt className="font-medium">{p.q}</dt>
              <dd className="mt-1 text-texto-suave">{p.r}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10 rounded-xl border border-acento/40 bg-acento-suave p-4">
        <p className="font-medium">¿Tenés equipo que no usás?</p>
        <p className="mt-1 text-sm">
          Publicarlo es gratis y tarda dos minutos. Hasta cinco publicaciones
          activas sin pagar nada.
        </p>
        <Link
          href="/publicar"
          className="mt-3 inline-block rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-2 hover:opacity-90"
        >
          Publicar algo
        </Link>
      </section>
    </div>
  );
}
