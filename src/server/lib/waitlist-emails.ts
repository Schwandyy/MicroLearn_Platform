import "server-only";
import { sendEmail } from "./email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3030";

export async function sendWaitlistConfirmation(opts: {
  to: string;
  token: string;
  locale: "de" | "en";
}): Promise<{ ok: boolean; reason?: string }> {
  const confirmUrl = `${APP_URL}/api/waitlist/confirm?token=${encodeURIComponent(opts.token)}&locale=${opts.locale}`;

  const COPY = {
    de: {
      subject: "MicroLearn Warteliste — E-Mail bestätigen",
      headline: "Deine E-Mail-Adresse bestätigen",
      body: "Du hast dich für die MicroLearn-Warteliste angemeldet. Klicke auf den Button unten, um deine E-Mail-Adresse zu bestätigen und deinen Platz zu sichern.",
      cta: "E-Mail bestätigen",
      hint: "Dieser Link ist 48 Stunden gültig. Wenn du dich nicht angemeldet hast, ignoriere diese Mail.",
      footer: "MicroLearn — Mikroelektronik strukturiert lernen",
    },
    en: {
      subject: "MicroLearn waitlist — confirm your email",
      headline: "Confirm your email address",
      body: "You signed up for the MicroLearn waitlist. Click the button below to confirm your email address and secure your spot.",
      cta: "Confirm email",
      hint: "This link expires in 48 hours. If you didn't sign up, ignore this email.",
      footer: "MicroLearn — Learn microelectronics, structured.",
    },
  } as const;

  const c = COPY[opts.locale];

  const html = buildEmailHtml({
    locale: opts.locale,
    headline: c.headline,
    body: c.body,
    ctaText: c.cta,
    ctaUrl: confirmUrl,
    hint: c.hint,
    footer: c.footer,
  });

  const text = `${c.headline}\n\n${c.body}\n\n${confirmUrl}\n\n${c.hint}\n\n${c.footer}`;

  return sendEmail({ to: opts.to, subject: c.subject, html, text });
}

export async function sendWaitlistWelcome(opts: {
  to: string;
  locale: "de" | "en";
}): Promise<{ ok: boolean; reason?: string }> {
  const COPY = {
    de: {
      subject: "Willkommen auf der MicroLearn-Warteliste!",
      headline: "Du bist dabei! 🎉",
      body: "Danke — deine E-Mail-Adresse ist bestätigt. Wir benachrichtigen dich als Erstes, wenn MicroLearn live geht. Bis dahin: Bleib neugierig!",
      hint: "Fragen? Schreib uns: habedank@odisey.de",
      footer: "MicroLearn — Mikroelektronik strukturiert lernen",
    },
    en: {
      subject: "You're on the MicroLearn waitlist!",
      headline: "You're in! 🎉",
      body: "Thank you — your email address is confirmed. We'll notify you first when MicroLearn goes live. Until then: stay curious!",
      hint: "Questions? Reach us at: habedank@odisey.de",
      footer: "MicroLearn — Learn microelectronics, structured.",
    },
  } as const;

  const c = COPY[opts.locale];

  const html = buildEmailHtml({
    locale: opts.locale,
    headline: c.headline,
    body: c.body,
    hint: c.hint,
    footer: c.footer,
  });

  const text = `${c.headline}\n\n${c.body}\n\n${c.hint}\n\n${c.footer}`;

  return sendEmail({ to: opts.to, subject: c.subject, html, text });
}

function buildEmailHtml(opts: {
  locale: string;
  headline: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  hint: string;
  footer: string;
}): string {
  const cta = opts.ctaUrl
    ? `<div style="margin:32px 0;text-align:center">
        <a href="${opts.ctaUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px">${opts.ctaText}</a>
       </div>`
    : "";

  return `<!doctype html>
<html lang="${opts.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.headline}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;padding:40px;max-width:560px">
        <tr><td>
          <div style="font-size:11px;letter-spacing:4px;color:#a16207;font-weight:700;text-transform:uppercase;margin-bottom:16px">MicroLearn</div>
          <h1 style="font-size:24px;margin:0 0 16px">${opts.headline}</h1>
          <p style="font-size:15px;line-height:1.6;margin:0 0 8px">${opts.body}</p>
          ${cta}
          <p style="font-size:13px;color:#666;line-height:1.5;margin:16px 0 0">${opts.hint}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
          <p style="font-size:12px;color:#999;margin:0">${opts.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
