import { NextResponse } from "next/server";
import { z } from "zod";
import { createPasswordResetToken } from "@/server/lib/password-reset";
import { sendEmail } from "@/server/lib/email";

const schema = z.object({ email: z.string().email() });

function buildEmail(opts: { resetUrl: string }) {
  return {
    subject: "Passwort zurücksetzen · MicroLearn",
    text:
      `Hi,\n\n` +
      `du (oder jemand anders) hat angefragt, dein Passwort zurückzusetzen.\n` +
      `Klick den Link unten innerhalb der nächsten 30 Minuten, um ein neues Passwort zu setzen:\n\n` +
      `${opts.resetUrl}\n\n` +
      `War das nicht du? Dann ignorier diese Mail einfach.\n`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="margin:0 0 12px">Passwort zurücksetzen</h2>
        <p style="color:#444">Du (oder jemand anders) hat angefragt, dein MicroLearn-Passwort zurückzusetzen.</p>
        <p>
          <a href="${opts.resetUrl}"
             style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">
            Neues Passwort setzen
          </a>
        </p>
        <p style="color:#666;font-size:13px">Der Link ist 30 Minuten gültig. War das nicht du? Dann ignorier diese Mail.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px">${opts.resetUrl}</p>
      </div>`,
  };
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const token = await createPasswordResetToken(parsed.data.email);
  // Wir antworten IMMER mit 200 — sonst leaken wir, ob die E-Mail registriert ist.

  if (token) {
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      new URL(req.url).origin;
    const resetUrl = `${base}/de/auth/reset-password/${token}`;
    const tpl = buildEmail({ resetUrl });
    await sendEmail({
      to: parsed.data.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  }

  return NextResponse.json({ ok: true });
}
