import type { Metadata } from "next";
import Link from "next/link";

import { RADIO_DISPLAY_M, RADIO_OFFSET_M } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué datos guarda Esgrimarket, para qué, y cómo borrarlos.",
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
      <div className="mt-2 space-y-3 text-texto-suave">{children}</div>
    </section>
  );
}

export default function PaginaPrivacidad() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Política de privacidad
      </h1>
      <p className="mt-1 text-sm text-texto-suave">
        Última actualización: 29 de agosto de 2026
      </p>

      <p className="mt-6 text-texto-suave">
        Esgrimarket es un proyecto gratuito para la comunidad de esgrima de
        Argentina. No vendemos datos, no hacemos publicidad dirigida y no
        usamos cookies de seguimiento.
      </p>

      <Seccion titulo="Qué guardamos">
        <p>
          <strong className="text-texto">Tu mail.</strong> Es lo único
          obligatorio: sirve para entrar. No lo mostramos a nadie.
        </p>
        <p>
          <strong className="text-texto">Tu teléfono.</strong> Se usa para armar
          el link de WhatsApp de tus publicaciones.{" "}
          <strong className="text-texto">Nunca aparece en la página.</strong>{" "}
          Quien quiere contactarte aprieta un botón que lo lleva a WhatsApp, y
          recién ahí ve tu número. Está guardado de forma que ni siquiera una
          consulta a la base lo devuelve en lote.
        </p>
        <p>
          <strong className="text-texto">Tu nombre, tu sala y tus zonas de
          entrega</strong>, si los cargás. Todo opcional.
        </p>
        <p>
          <strong className="text-texto">Tus publicaciones</strong>: título,
          descripción, características, precio y fotos. Eso es público, es el
          sentido de la app.
        </p>
        <p>
          <strong className="text-texto">Cuántas veces</strong> alguien apretó
          el botón de WhatsApp en cada publicación tuya. Es un número, no
          guardamos quién fue.
        </p>
      </Seccion>

      <Seccion titulo="La ubicación es aproximada a propósito">
        <p>
          Si marcás dónde se retira algo, tu dispositivo{" "}
          <strong className="text-texto">
            corre el punto al azar hasta {RADIO_OFFSET_M} metros antes de
            enviarlo
          </strong>
          . La coordenada exacta no sale nunca de tu teléfono o computadora: no
          llega a nuestro servidor ni queda guardada en ningún lado.
        </p>
        <p>
          En el mapa se dibuja un círculo de {RADIO_DISPLAY_M} metros alrededor
          de ese punto ya corrido. Nadie puede deducir tu dirección, ni nosotros.
        </p>
      </Seccion>

      <Seccion titulo="Con quién se comparte">
        <p>
          Con nadie, en el sentido comercial. Pero la app corre sobre servicios
          de terceros que técnicamente ven ciertos datos:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-texto">Supabase</strong> guarda la base de
            datos y las fotos, en servidores de Estados Unidos.
          </li>
          <li>
            <strong className="text-texto">Vercel</strong> aloja el sitio y ve
            las direcciones IP de las visitas, como cualquier servidor web.
          </li>
          <li>
            <strong className="text-texto">Gmail</strong> envía los mails con el
            código de ingreso.
          </li>
          <li>
            <strong className="text-texto">OpenStreetMap</strong> provee las
            imágenes del mapa. Cuando abrís la página del mapa, tu navegador se
            las pide directamente a ellos, así que ven tu IP.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="Cuánto tiempo">
        <p>
          Las publicaciones vencen a los 45 días y dejan de mostrarse. Podés
          borrarlas antes cuando quieras.
        </p>
        <p>
          Tus datos de cuenta quedan mientras la cuenta exista. Si la borrás, se
          va todo: publicaciones, fotos, teléfono y mail.
        </p>
      </Seccion>

      <Seccion titulo="Tus derechos">
        <p>
          Podés ver y cambiar todos tus datos desde{" "}
          <Link href="/cuenta" className="text-acento underline">
            tu cuenta
          </Link>
          , y borrar la cuenta entera desde esa misma pantalla, sin pedirle
          permiso a nadie ni escribir un mail.
        </p>
        <p>
          En Argentina rige la Ley 25.326 de Protección de los Datos Personales.
          La Agencia de Acceso a la Información Pública es el organismo de
          control y atiende las denuncias de quien considere que sus derechos
          fueron vulnerados.
        </p>
      </Seccion>

      <Seccion titulo="Las operaciones son entre ustedes">
        <p>
          Esgrimarket sólo publica avisos y conecta por WhatsApp. No
          intermediamos pagos, no verificamos productos y no participamos de las
          entregas. Lo que se acuerde después del primer mensaje corre por
          cuenta de las dos partes.
        </p>
      </Seccion>

      <Seccion titulo="Contacto">
        <p>
          Escribinos a{" "}
          <a href="mailto:esgrimanaval@gmail.com" className="text-acento underline">
            esgrimanaval@gmail.com
          </a>
          .
        </p>
      </Seccion>
    </div>
  );
}
