import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envío de avisos por mail.
 *
 * Va por SMTP de Gmail con una contraseña de aplicación, igual que la
 * autenticación. WhatsApp automático quedaría mejor, pero requiere la API de
 * WhatsApp Business con plantillas aprobadas por Meta: no es algo que se
 * pueda encender desde acá.
 *
 * Si faltan las credenciales, no se manda nada y se registra: publicar nunca
 * puede fallar porque el aviso no salió.
 */
let transporte: Transporter | null = null;

function obtenerTransporte(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  transporte ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return transporte;
}

export type AvisoCoincidencia = {
  para: string;
  queBuscaba: string | null;
  titulo: string;
  precio: string;
  url: string;
};

export async function avisarCoincidencia(a: AvisoCoincidencia): Promise<boolean> {
  const t = obtenerTransporte();
  if (!t) {
    console.warn("Aviso no enviado: faltan GMAIL_USER / GMAIL_APP_PASSWORD.");
    return false;
  }

  const buscaba = a.queBuscaba ? `“${a.queBuscaba}”` : "lo que estabas buscando";

  const texto = `Alguien publicó algo que coincide con ${buscaba}:

${a.titulo}
${a.precio}

${a.url}

Podés dejar de recibir estos avisos desde tu cuenta en Esgrimarket.`;

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14181d">
  <p style="font-size:15px;margin:0 0 16px">Alguien publicó algo que coincide con ${buscaba}:</p>
  <div style="border:1px solid #e2e6ea;border-radius:12px;padding:16px;margin:0 0 20px">
    <p style="font-size:17px;font-weight:600;margin:0 0 4px">${a.titulo}</p>
    <p style="font-size:15px;color:#5b6672;margin:0">${a.precio}</p>
  </div>
  <p style="margin:0 0 24px">
    <a href="${a.url}" style="background:#0b6bcb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;display:inline-block;font-weight:500">Ver la publicación</a>
  </p>
  <p style="font-size:13px;color:#5b6672;border-top:1px solid #e2e6ea;padding-top:16px;margin:0">
    Recibís esto porque guardaste una búsqueda en Esgrimarket. Podés borrarla
    desde tu cuenta.
  </p>
</div>`;

  try {
    await t.sendMail({
      from: `"Esgrimarket" <${process.env.GMAIL_USER}>`,
      to: a.para,
      subject: `Apareció ${a.titulo}`,
      text: texto,
      html,
    });
    return true;
  } catch (e) {
    // Un aviso que no sale no puede romper nada: sólo se registra.
    console.error("Error mandando aviso:", e);
    return false;
  }
}
