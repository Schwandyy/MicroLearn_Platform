import "server-only";
import webpush from "web-push";
import { prisma } from "@/server/db/prisma";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title_de: string;
  title_en: string;
  body_de: string;
  body_en: string;
  url?: string;
}

export async function sendPush(userId: string, payload: PushPayload) {
  configure();
  if (!configured) return { ok: false, error: "vapid_not_configured" as const };

  const subs = await prisma.pushSubscription.findMany({
    where: { userId, enabled: true },
  });
  let sent = 0;
  for (const sub of subs) {
    const localized = {
      title: sub.locale === "en" ? payload.title_en : payload.title_de,
      body: sub.locale === "en" ? payload.body_en : payload.body_de,
      url: payload.url ?? "/",
    };
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(localized),
      );
      sent += 1;
    } catch (err) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 410 || e.statusCode === 404) {
        await prisma.pushSubscription
          .update({ where: { id: sub.id }, data: { enabled: false } })
          .catch(() => undefined);
      }
    }
  }
  return { ok: true as const, sent };
}

export async function sendStreakReminders() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Users whose streak was active yesterday but not today
  const streaks = await prisma.streak.findMany({
    where: {
      currentDays: { gt: 0 },
      lastActiveDay: { gte: yesterday, lt: today },
    },
    include: { user: { include: { profile: true } } },
    take: 500,
  });

  let total = 0;
  for (const s of streaks) {
    const res = await sendPush(s.userId, {
      title_de: `Deine Streak: ${s.currentDays} Tage 🔥`,
      title_en: `Your streak: ${s.currentDays} days 🔥`,
      body_de: "Heute noch eine Lektion, dann läuft sie weiter.",
      body_en: "One lesson today keeps your streak alive.",
      url: "/dashboard",
    });
    if (res.ok) total += res.sent ?? 0;
  }
  return { ok: true as const, reminded: total };
}
