import "server-only";
import { prisma } from "@/server/db/prisma";
import { sendEmail } from "@/server/lib/email";
import { signUnsubscribeToken } from "@/server/lib/unsubscribe-token";

type Locale = "de" | "en";

const COPY: Record<Locale, {
  subject: (name: string, monthLabel: string) => string;
  preheader: (name: string) => string;
  hello: (name: string) => string;
  intro: (name: string, monthLabel: string) => string;
  noActivity: (name: string) => string;
  stats: {
    completions: string;
    streak: string;
    xp: string;
  };
  topLessons: string;
  nextCta: string;
  proPitch: string;
  footer: string;
  unsubscribe: string;
  monthLabel: (month: number, year: number) => string;
}> = {
  de: {
    subject: (name, m) => `Was ${name} im ${m} gebaut hat`,
    preheader: (name) => `${name} hat diesen Monat wieder getüftelt.`,
    hello: (name) => `Hallo${name ? ` ${name}` : ""},`,
    intro: (childName, month) =>
      `hier ist der Monatsrückblick für ${childName} im ${month}. ` +
      `Nichts zum Antworten — nur ein kurzer Einblick, was passiert ist.`,
    noActivity: (childName) =>
      `${childName} hat im letzten Monat keine Lessons abgeschlossen. ` +
      `Das ist okay — Lernen passiert auch im Kopf, nicht nur im Tracker.`,
    stats: {
      completions: "Lessons abgeschlossen",
      streak: "Längster Streak",
      xp: "XP gesammelt",
    },
    topLessons: "Letzte Lessons",
    nextCta: "Lernfortschritt ansehen",
    proPitch:
      "Lust auf mehr? Mit MicroLearn Pro gibt's vertiefte Lernpfade, " +
      "den KI-Mentor und druckbare Zertifikate für jeden abgeschlossenen Pfad.",
    footer:
      "Diesen Bericht erhältst du, weil dein Kind deine E-Mail in den App-Einstellungen hinterlegt hat. " +
      "Wir senden keine Werbung, keine Daten an Dritte, keine Spam-Frequenz.",
    unsubscribe: "Monatsbericht abbestellen",
    monthLabel: (m, y) => {
      const months = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember",
      ];
      return `${months[m]} ${y}`;
    },
  },
  en: {
    subject: (name, m) => `What ${name} built in ${m}`,
    preheader: (name) => `${name} tinkered again this month.`,
    hello: (name) => `Hi${name ? ` ${name}` : ""},`,
    intro: (childName, month) =>
      `here is the monthly recap for ${childName} in ${month}. ` +
      `Nothing to reply to — just a quick glimpse of what happened.`,
    noActivity: (childName) =>
      `${childName} didn't complete any lessons last month. ` +
      `That's fine — learning happens off-tracker too.`,
    stats: {
      completions: "lessons completed",
      streak: "longest streak",
      xp: "XP earned",
    },
    topLessons: "Recent lessons",
    nextCta: "View progress",
    proPitch:
      "Want more? MicroLearn Pro unlocks deeper learning paths, " +
      "the AI mentor and printable certificates for every completed path.",
    footer:
      "You receive this report because your child added your email in the app settings. " +
      "No ads, no third-party sharing, no spammy cadence.",
    unsubscribe: "Unsubscribe from monthly report",
    monthLabel: (m, y) => {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      return `${months[m]} ${y}`;
    },
  },
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  "https://app.microlearn.example";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build (and optionally send) the monthly parent digest for every user
 * who set a `parentEmail` and didn't opt out. Considers the *previous*
 * calendar month — so when run on the 1st of March, looks at February.
 *
 * Idempotency: `Profile.monthlyParentDigestLastAt` (or here on User) —
 * we use `User.monthlyParentDigestLastAt` so re-runs in the same month
 * skip already-sent recipients.
 */
export async function runMonthlyParentDigest(opts: { dry?: boolean } = {}): Promise<{
  total: number;
  sent: number;
  skipped: number;
  digests: Array<{
    userId: string;
    childName: string;
    parentEmail: string | null;
    sent: boolean;
    reason?: string;
  }>;
}> {
  const now = new Date();
  // Previous month
  const targetMonth = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
  const targetYear =
    now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const periodStart = new Date(Date.UTC(targetYear, targetMonth, 1));
  const periodEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 1));

  const eligible = await prisma.user.findMany({
    where: {
      parentEmail: { not: null },
      monthlyParentDigestOptOut: false,
      role: { not: "STUDENT_CODE" },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      username: true,
      preferredLocale: true,
      parentEmail: true,
      monthlyParentDigestLastAt: true,
    },
  });

  const out: Awaited<ReturnType<typeof runMonthlyParentDigest>>["digests"] = [];
  let sent = 0;
  let skipped = 0;

  for (const user of eligible) {
    const childName = user.name ?? user.username ?? "your child";
    const parentEmail = user.parentEmail!;

    // Idempotency: skip if we already sent within the current calendar month
    const last = user.monthlyParentDigestLastAt;
    if (last && last >= new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))) {
      skipped++;
      out.push({
        userId: user.id,
        childName,
        parentEmail,
        sent: false,
        reason: "already_sent_this_month",
      });
      continue;
    }

    const locale: Locale = user.preferredLocale === "en" ? "en" : "de";
    const c = COPY[locale];
    const monthLabel = c.monthLabel(targetMonth, targetYear);

    // Gather stats for the previous month
    const [completions, xpAgg, streak] = await Promise.all([
      prisma.userProgress.findMany({
        where: {
          userId: user.id,
          completedAt: { gte: periodStart, lt: periodEnd },
          lessonId: { not: null },
        },
        include: {
          lesson: {
            select: { title_de: true, title_en: true, slug: true },
          },
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),
      prisma.xPTransaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      prisma.streak.findUnique({
        where: { userId: user.id },
        select: { longestDays: true, currentDays: true },
      }),
    ]);

    const completionsCount = completions.length;
    const xpEarned = xpAgg._sum.amount ?? 0;
    const longestStreak = streak?.longestDays ?? 0;

    const subject = c.subject(childName, monthLabel);
    const unsubToken = signUnsubscribeToken(user.id, "parentMonthly");
    const unsubUrl = `${APP_URL}/api/unsubscribe?u=${encodeURIComponent(
      user.id,
    )}&k=parentMonthly&t=${unsubToken}&locale=${locale}`;
    const dashboardUrl = `${APP_URL}/${locale}/dashboard`;

    const recentLessons = completions
      .map((p) =>
        locale === "de" ? p.lesson?.title_de : p.lesson?.title_en,
      )
      .filter((s): s is string => Boolean(s));

    const text =
      `${c.hello("")}\n\n` +
      `${c.intro(childName, monthLabel)}\n\n` +
      (completionsCount === 0
        ? `${c.noActivity(childName)}\n`
        : `• ${completionsCount} ${c.stats.completions}\n` +
          `• ${longestStreak} ${c.stats.streak}\n` +
          `• ${xpEarned} ${c.stats.xp}\n\n` +
          `${c.topLessons}:\n` +
          recentLessons.map((l) => `– ${l}`).join("\n") +
          "\n\n") +
      `${c.nextCta}: ${dashboardUrl}\n\n` +
      `—\n${c.footer}\n${c.unsubscribe}: ${unsubUrl}\n`;

    const statBlock =
      completionsCount === 0
        ? `<p style="color:#666;font-size:14px;line-height:1.6">${escapeHtml(c.noActivity(childName))}</p>`
        : `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:16px 0">
  <tr>
    <td align="center" style="padding:0 8px">
      <div style="font-size:28px;font-weight:700;color:#0f172a">${completionsCount}</div>
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px">${escapeHtml(c.stats.completions)}</div>
    </td>
    <td align="center" style="padding:0 8px;border-left:1px solid #eee;border-right:1px solid #eee">
      <div style="font-size:28px;font-weight:700;color:#0f172a">${longestStreak}</div>
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px">${escapeHtml(c.stats.streak)}</div>
    </td>
    <td align="center" style="padding:0 8px">
      <div style="font-size:28px;font-weight:700;color:#0f172a">${xpEarned}</div>
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px">${escapeHtml(c.stats.xp)}</div>
    </td>
  </tr>
</table>`;

    const lessonsList =
      recentLessons.length > 0
        ? `
<h2 style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:2px;margin:24px 0 8px">${escapeHtml(c.topLessons)}</h2>
<ul style="margin:0;padding:0 0 0 20px;color:#0f172a;font-size:15px;line-height:1.7">
  ${recentLessons.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
</ul>`
        : "";

    const html = `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
  <div style="display:none;visibility:hidden;opacity:0;font-size:0;height:0;line-height:0;mso-hide:all">${escapeHtml(c.preheader(childName))}</div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:540px;background:#fff;border-radius:14px;padding:32px 28px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
        <tr><td>
          <div style="font-size:11px;letter-spacing:4px;color:#a16207;font-weight:700;text-transform:uppercase">MicroLearn</div>
          <h1 style="font-size:22px;margin:8px 0 16px;color:#0f172a">${escapeHtml(subject)}</h1>
          <p style="font-size:15px;line-height:1.6;color:#0f172a">${escapeHtml(c.intro(childName, monthLabel))}</p>
          ${statBlock}
          ${lessonsList}
          <p style="margin:24px 0">
            <a href="${dashboardUrl}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(c.nextCta)} →</a>
          </p>
          <p style="font-size:13px;color:#888;line-height:1.6">${escapeHtml(c.proPitch)}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="font-size:11px;color:#888;line-height:1.6">${escapeHtml(c.footer)}</p>
          <p style="font-size:11px"><a href="${unsubUrl}" style="color:#a16207">${escapeHtml(c.unsubscribe)}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let result: { ok: boolean; reason?: string } = { ok: true };
    if (!opts.dry) {
      result = await sendEmail({
        to: parentEmail,
        subject,
        html,
        text,
      });
    }

    if (result.ok && !opts.dry) {
      await prisma.user.update({
        where: { id: user.id },
        data: { monthlyParentDigestLastAt: new Date() },
      });
      sent++;
    } else if (!result.ok) {
      skipped++;
    }

    out.push({
      userId: user.id,
      childName,
      parentEmail,
      sent: result.ok,
      reason: result.reason,
    });
  }

  return { total: eligible.length, sent, skipped, digests: out };
}
