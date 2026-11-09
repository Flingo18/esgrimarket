import "server-only";

/**
 * Envío de avisos por mail, con Resend.
 *
 * Se manda contra la API por HTTP y no por SMTP: es un POST, así que no hace
 * falta cliente de correo ni mantener una conexión abierta en una función que
 * vive unos segundos.
 *
 * Ojo: esto NO es el mail de ingreso. Los códigos para entrar los manda
 * Supabase con su propia configuración, que es aparte y no se toca acá.
 *
 * Si falta la clave no se manda nada y se registra: publicar nunca puede
 * fallar porque el aviso no salió.
 */
const REMITENTE = "Esgrimarket <avisos@esgrimarket.com.ar>";

/**
 * Escapa texto de usuario antes de meterlo en el HTML del mail.
 *
 * El título de una publicación y el nombre de un torneo los escribe
 * cualquiera. Sin esto, alguien podía publicar con un `<a href>` en el título
 * y ese enlace llegaba renderizado, en un mail salido de nuestro dominio, a
 * todos los que tuvieran una búsqueda que coincidiera.
 *
 * La versión en texto plano no lo necesita: ahí nada se interpreta.
 */
function esc(v: string | null | undefined): string {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type Mail = {
  para: string;
  asunto: string;
  texto: string;
  html: string;
};

/**
 * Qué pasó con un envío.
 *
 * Se distingue "no está configurado" de "Resend lo rechazó" porque se
 * arreglan de maneras distintas: lo primero es una variable que falta en
 * Vercel y lo segundo suele ser el dominio sin verificar. Un `false` pelado
 * obligaba a ir a buscar la causa a los logs.
 */
export type Envio = { ok: true } | { ok: false; motivo: string };

/** Si no está la clave, no se manda nada y el cron lo informa en su respuesta. */
export function hayClaveResend(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function mandar(m: Mail): Promise<Envio> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    console.warn("Aviso no enviado: falta RESEND_API_KEY.");
    return { ok: false, motivo: "falta RESEND_API_KEY" };
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [m.para],
        subject: m.asunto,
        text: m.texto,
        html: m.html,
      }),
    });

    if (!r.ok) {
      // El cuerpo dice el motivo real (dominio sin verificar, clave inválida),
      // y sin eso el error es imposible de diagnosticar desde los logs.
      const detalle = await r.text();
      console.error("Resend rechazó el aviso:", r.status, detalle);
      return { ok: false, motivo: `Resend respondió ${r.status}: ${detalle.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    // Un aviso que no sale no puede romper nada: sólo se registra.
    console.error("Error mandando aviso:", e);
    return { ok: false, motivo: e instanceof Error ? e.message : String(e) };
  }
}

export type AvisoCoincidencia = {
  para: string;
  queBuscaba: string | null;
  titulo: string;
  precio: string;
  url: string;
};

export async function avisarCoincidencia(a: AvisoCoincidencia): Promise<boolean> {
  const buscaba = a.queBuscaba ? `“${a.queBuscaba}”` : "lo que estabas buscando";

  const texto = `Alguien publicó algo que coincide con ${buscaba}:

${a.titulo}
${a.precio}

${a.url}

Podés dejar de recibir estos avisos desde tu cuenta en Esgrimarket.`;

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14181d">
  <p style="font-size:15px;margin:0 0 16px">Alguien publicó algo que coincide con ${esc(buscaba)}:</p>
  <div style="border:1px solid #e2e6ea;border-radius:12px;padding:16px;margin:0 0 20px">
    <p style="font-size:17px;font-weight:600;margin:0 0 4px">${esc(a.titulo)}</p>
    <p style="font-size:15px;color:#5b6672;margin:0">${esc(a.precio)}</p>
  </div>
  <p style="margin:0 0 24px">
    <a href="${esc(a.url)}" style="background:#0b6bcb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;display:inline-block;font-weight:500">Ver la publicación</a>
  </p>
  <p style="font-size:13px;color:#5b6672;border-top:1px solid #e2e6ea;padding-top:16px;margin:0">
    Recibís esto porque guardaste una búsqueda en Esgrimarket. Podés borrarla
    desde tu cuenta.
  </p>
</div>`;

  return (
    await mandar({
      para: a.para,
      asunto: `Apareció ${a.titulo}`,
      texto,
      html,
    })
  ).ok;
}

export type AvisoVencimiento = {
  para: string;
  titulo: string;
  /** Fecha de vencimiento ya escrita en castellano: "26 de octubre". */
  cuando: string;
  url: string;
};

/**
 * "Tu publicación vence en una semana" / "se venció".
 *
 * Sale dos veces por publicación: una a los siete días de margen y otra el
 * día que efectivamente se cayó del listado. El primero existe para que no
 * llegue a desaparecer; el segundo, para el que igual se la perdió.
 *
 * Al que ya vendió se le dice explícitamente que no haga nada. Es la mitad
 * del valor de estos mails: el vencimiento está para limpiar lo que ya no se
 * consigue, y alguien que renueva por inercia lo que vendió hace un mes hace
 * exactamente el daño que el vencimiento venía a evitar.
 *
 * El link lleva al listado, no reactiva. Un GET que reactivara se dispararía
 * solo: los servidores de correo visitan los links para escanearlos, como ya
 * pasa con los de ingreso (ver `src/app/ingresar/page.tsx`).
 */
export async function avisarVencimiento(
  a: AvisoVencimiento & { vencida: boolean },
): Promise<Envio> {
  const boton = a.vencida ? "Volver a publicarla" : "Renovarla";

  const asunto = a.vencida
    ? "Tu publicación en Esgrimarket se venció"
    : "Tu publicación en Esgrimarket vence en una semana";

  const entrada = a.vencida
    ? `Tu publicación ${a.titulo} se venció y ya no se ve en el sitio.

Si seguís vendiéndola, volvé a activarla con un clic.`
    : `Tu publicación ${a.titulo} vence el ${a.cuando}. Después de esa fecha deja de verse en el sitio.

Si ya la vendiste, no hagas nada.
Si seguís vendiéndola, renovala y queda otros 45 días.`;

  const texto = `${entrada}

${a.url}

Recibís esto porque publicaste en Esgrimarket.`;

  const cuerpoHtml = a.vencida
    ? `<p style="font-size:15px;margin:0 0 16px">Tu publicación <strong>${esc(a.titulo)}</strong> se venció y ya no se ve en el sitio.</p>
  <p style="font-size:15px;margin:0 0 20px">Si seguís vendiéndola, volvé a activarla con un clic.</p>`
    : `<p style="font-size:15px;margin:0 0 16px">Tu publicación <strong>${esc(a.titulo)}</strong> vence el <strong>${esc(a.cuando)}</strong>. Después de esa fecha deja de verse en el sitio.</p>
  <p style="font-size:15px;margin:0 0 20px">Si ya la vendiste, no hagas nada.<br>Si seguís vendiéndola, renovala y queda otros 45 días.</p>`;

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14181d">
  ${cuerpoHtml}
  <p style="margin:0 0 24px">
    <a href="${esc(a.url)}" style="background:#0b6bcb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;display:inline-block;font-weight:500">${boton}</a>
  </p>
  <p style="font-size:13px;color:#5b6672;border-top:1px solid #e2e6ea;padding-top:16px;margin:0">
    Recibís esto porque publicaste en Esgrimarket. Las publicaciones vencen a
    los 45 días para que el mercadito no se llene de cosas que ya se vendieron.
  </p>
</div>`;

  return mandar({ para: a.para, asunto, texto, html });
}

export type AvisoTorneo = {
  para: string;
  nombre: string;
  cuando: string;
  organizador: string;
  armas: string;
  cierre: string | null;
  url: string;
};

/**
 * "Apareció un torneo de espada".
 *
 * El cierre de inscripción va en el asunto cuando existe: es el dato que
 * hace que alguien abra el mail hoy y no el mes que viene.
 */
export async function avisarTorneo(a: AvisoTorneo): Promise<boolean> {
  const asunto = a.cierre
    ? `${a.nombre} — cierra la inscripción el ${a.cierre}`
    : `Torneo nuevo: ${a.nombre}`;

  const texto = `Se cargó un torneo que coincide con lo que seguís${a.armas ? ` (${a.armas})` : ""}:

${a.nombre}
${a.cuando}
${a.organizador}${a.cierre ? `\nCierra la inscripción: ${a.cierre}` : ""}

${a.url}

Las fechas las carga la comunidad, no las federaciones: confirmala en la
página oficial de quien organiza antes de viajar o de pagar la inscripción.

Podés dejar de recibir estos avisos desde tu cuenta en Esgrimarket.`;

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14181d">
  <p style="font-size:15px;margin:0 0 16px">Se cargó un torneo que coincide con lo que seguís${a.armas ? ` <strong>(${esc(a.armas)})</strong>` : ""}:</p>
  <div style="border:1px solid #e2e6ea;border-radius:12px;padding:16px;margin:0 0 20px">
    <p style="font-size:17px;font-weight:600;margin:0 0 4px">${esc(a.nombre)}</p>
    <p style="font-size:15px;color:#5b6672;margin:0 0 4px">${esc(a.cuando)}</p>
    <p style="font-size:14px;color:#5b6672;margin:0">${esc(a.organizador)}</p>
    ${a.cierre ? `<p style="font-size:14px;color:#b42318;margin:8px 0 0">Cierra la inscripción: ${esc(a.cierre)}</p>` : ""}
  </div>
  <p style="margin:0 0 20px">
    <a href="${esc(a.url)}" style="background:#0b6bcb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;display:inline-block;font-weight:500">Ver el torneo</a>
  </p>
  <p style="font-size:13px;color:#5b6672;margin:0 0 16px">
    Las fechas las carga la comunidad, no las federaciones. Confirmala en la
    página oficial de quien organiza antes de viajar o de pagar la inscripción.
  </p>
  <p style="font-size:13px;color:#5b6672;border-top:1px solid #e2e6ea;padding-top:16px;margin:0">
    Recibís esto porque pediste que te avisáramos de torneos nuevos. Podés
    cambiarlo o darlo de baja desde tu cuenta.
  </p>
</div>`;

  return (await mandar({ para: a.para, asunto, texto, html })).ok;
}
