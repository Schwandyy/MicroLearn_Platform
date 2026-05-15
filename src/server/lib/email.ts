import "server-only";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "MicroLearn <no-reply@example.com>";

let client: Resend | null = null;

export function emailConfigured(): boolean {
  return Boolean(RESEND_API_KEY) && Boolean(process.env.EMAIL_FROM);
}

function getClient(): Resend {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!emailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[email] Skipping send (no RESEND_API_KEY). To:", opts.to);
      console.warn("[email] Subject:", opts.subject);
      console.warn("[email] Text:\n" + opts.text);
    }
    return { ok: false, reason: "not_configured" };
  }
  try {
    await getClient().emails.send({
      from: EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  }
}
