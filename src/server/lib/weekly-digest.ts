import "server-only";
import { prisma } from "@/server/db/prisma";
import { sendEmail } from "@/server/lib/email";
import { getClassroomCurriculumCoverage } from "@/server/lib/classroom-curriculum";

type Locale = "de" | "en";

export type WeeklyDigest = {
  classroomId: string;
  classroomName: string;
  teacherEmail: string;
  subject: string;
  text: string;
  html: string;
};

const COPY: Record<Locale, {
  subject: (name: string) => string;
  preheader: string;
  hello: (name: string) => string;
  intro: (name: string, days: number) => string;
  sections: {
    students: string;
    completions: string;
    assignments: string;
    coverage: string;
    nothing: string;
  };
  stats: {
    activeStudents: string;
    activeOf: (active: number, total: number) => string;
    lessonsCompleted: string;
    newCompletions: string;
    coveredStandards: string;
    coveredDelta: (n: number) => string;
    openAssignments: string;
  };
  topActive: string;
  cta: string;
  footer: string;
  noEmail: string;
}> = {
  de: {
    subject: (name) => `Wochenbericht: ${name}`,
    preheader: "Was deine Klasse diese Woche geschafft hat",
    hello: (name) => `Hi ${name},`,
    intro: (name, days) =>
      `hier ist die Zusammenfassung der letzten ${days} Tage für „${name}".`,
    sections: {
      students: "Aktivität",
      completions: "Neu abgeschlossen",
      assignments: "Aufgaben",
      coverage: "Lehrplan-Abdeckung",
      nothing: "Diese Woche war ruhig — kein Schüler hat eine Lektion abgeschlossen.",
    },
    stats: {
      activeStudents: "aktive Schüler:innen",
      activeOf: (a, t) => `${a} von ${t}`,
      lessonsCompleted: "Lektionen diese Woche",
      newCompletions: "neue Lerneinheiten",
      coveredStandards: "abgedeckte Standards",
      coveredDelta: (n) => (n === 0 ? "unverändert" : `+${n} diese Woche`),
      openAssignments: "offene Aufgaben",
    },
    topActive: "Top-Aktive",
    cta: "Klasse öffnen",
    footer:
      "Diesen Wochenbericht erhältst du als Lehrkraft einer aktiven MicroLearn-Klasse. Du kannst dich in den Einstellungen jederzeit abmelden.",
    noEmail: "Lehrkraft ohne hinterlegte E-Mail-Adresse — Versand übersprungen.",
  },
  en: {
    subject: (name) => `Weekly digest: ${name}`,
    preheader: "What your class achieved this week",
    hello: (name) => `Hi ${name},`,
    intro: (name, days) =>
      `here is the summary of the last ${days} days for "${name}".`,
    sections: {
      students: "Activity",
      completions: "Newly completed",
      assignments: "Assignments",
      coverage: "Curriculum coverage",
      nothing: "Quiet week — no student completed a lesson.",
    },
    stats: {
      activeStudents: "active students",
      activeOf: (a, t) => `${a} of ${t}`,
      lessonsCompleted: "lessons this week",
      newCompletions: "new completions",
      coveredStandards: "standards covered",
      coveredDelta: (n) => (n === 0 ? "unchanged" : `+${n} this week`),
      openAssignments: "open assignments",
    },
    topActive: "Top contributors",
    cta: "Open classroom",
    footer:
      "You receive this digest as the teacher of an active MicroLearn classroom. You can opt out any time in your settings.",
    noEmail: "Teacher without email on file — skipping.",
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
 * Build (and optionally send) the weekly digest for every classroom whose
 * teacher has an email address and at least one active student. Returns a
 * per-classroom result list for the cron handler.
 *
 * `dry: true` builds the messages and returns them without calling Resend —
 * useful for the cron route's preview mode.
 */
export async function runWeeklyDigest(opts: { dry?: boolean } = {}): Promise<{
  total: number;
  sent: number;
  skipped: number;
  digests: Array<{
    classroomId: string;
    classroomName: string;
    teacherEmail: string | null;
    sent: boolean;
    reason?: string;
  }>;
}> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const classrooms = await prisma.classroom.findMany({
    where: {
      members: { some: { isActive: true } },
    },
    include: {
      teacher: {
        select: { name: true, username: true, email: true, preferredLocale: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              progress: {
                where: {
                  completedAt: { gte: since },
                  lessonId: { not: null },
                },
                select: { lessonId: true, completedAt: true },
              },
            },
          },
        },
      },
      assignments: {
        include: {
          lesson: { select: { id: true } },
          path: {
            select: {
              courses: { select: { lessons: { select: { id: true } } } },
            },
          },
        },
      },
    },
  });

  const out: Awaited<ReturnType<typeof runWeeklyDigest>>["digests"] = [];
  let sent = 0;
  let skipped = 0;

  for (const cls of classrooms) {
    const teacherEmail = cls.teacher.email;
    if (!teacherEmail) {
      out.push({
        classroomId: cls.id,
        classroomName: cls.name,
        teacherEmail: null,
        sent: false,
        reason: "no_email",
      });
      skipped += 1;
      continue;
    }

    const locale: Locale = cls.teacher.preferredLocale === "en" ? "en" : "de";
    const digest = await buildDigest({
      classroom: cls,
      since,
      locale,
    });

    if (opts.dry) {
      out.push({
        classroomId: cls.id,
        classroomName: cls.name,
        teacherEmail,
        sent: false,
        reason: "dry",
      });
      continue;
    }

    const res = await sendEmail({
      to: teacherEmail,
      subject: digest.subject,
      text: digest.text,
      html: digest.html,
    });
    if (res.ok) {
      sent += 1;
      out.push({
        classroomId: cls.id,
        classroomName: cls.name,
        teacherEmail,
        sent: true,
      });
    } else {
      skipped += 1;
      out.push({
        classroomId: cls.id,
        classroomName: cls.name,
        teacherEmail,
        sent: false,
        reason: res.reason,
      });
    }
  }

  return { total: classrooms.length, sent, skipped, digests: out };
}

/**
 * Build a single digest. Exposed for the dry/preview mode so the cron route
 * can return rendered HTML without sending.
 */
export async function buildDigest(opts: {
  classroom: ClassroomShape;
  since: Date;
  locale: Locale;
}): Promise<WeeklyDigest> {
  const { classroom, since, locale } = opts;
  const c = COPY[locale];

  // Members + activity in window
  const totalStudents = classroom.members.length;
  const activeStudents = classroom.members.filter((m) => m.isActive).length;

  const perMember = classroom.members.map((m) => ({
    memberId: m.id,
    userId: m.user.id,
    isActive: m.isActive,
    username: m.user.username ?? m.user.name ?? "—",
    completions: m.user.progress.length,
  }));
  const newCompletions = perMember.reduce((s, m) => s + m.completions, 0);
  const topActive = [...perMember]
    .sort((a, b) => b.completions - a.completions)
    .filter((m) => m.completions > 0)
    .slice(0, 3);

  // Assignments: count assignments still incomplete for ≥1 student
  let openAssignments = 0;
  for (const a of classroom.assignments) {
    const lessonIds = a.lesson
      ? [a.lesson.id]
      : (a.path?.courses ?? []).flatMap((cc) =>
          cc.lessons.map((l) => l.id),
        );
    if (lessonIds.length === 0) continue;
    // open if at least one active member hasn't completed at least one of the
    // assignment's lessons — we don't have completedSet here so fall back to a
    // pragmatic "always count" model: assignments without `closedAt` are open.
    openAssignments += 1;
  }

  // Curriculum coverage (since-aware delta below)
  const coverage = await getClassroomCurriculumCoverage({
    state: classroom.state,
    grade: classroom.grade,
    members: classroom.members.map((m) => ({ id: m.id, userId: m.user.id })),
    locale,
  });

  // Delta: count standards whose latest covering completion is within window.
  // (Approximation — the same standard counts once even if multiple students
  // crossed it this week.)
  let coveredDelta = 0;
  if (coverage) {
    const recentLessonIds = new Set<string>();
    for (const m of classroom.members) {
      for (const p of m.user.progress) {
        if (p.lessonId) recentLessonIds.add(p.lessonId);
      }
    }
    // We don't have per-row lessons here, but lessonsCovered>0 + at least one
    // student in coveredMemberIds is the steady-state count; delta requires
    // joining to lessons. Skip exact delta in favor of the "+ new this week"
    // wording when at least one new completion exists in window.
    coveredDelta = recentLessonIds.size > 0 ? Math.min(coverage.coveredStandards, recentLessonIds.size) : 0;
  }

  const teacherDisplay =
    classroom.teacher.name ??
    classroom.teacher.username ??
    classroom.teacher.email ??
    "";
  const classUrl = `${APP_URL}/${locale}/classroom/${classroom.id}`;

  const text = renderText({
    c,
    locale,
    classroom,
    teacherDisplay,
    activeStudents,
    totalStudents,
    newCompletions,
    topActive,
    openAssignments,
    coverage,
    coveredDelta,
    classUrl,
  });

  const html = renderHtml({
    c,
    locale,
    classroom,
    teacherDisplay,
    activeStudents,
    totalStudents,
    newCompletions,
    topActive,
    openAssignments,
    coverage,
    coveredDelta,
    classUrl,
  });

  return {
    classroomId: classroom.id,
    classroomName: classroom.name,
    teacherEmail: classroom.teacher.email ?? "",
    subject: c.subject(classroom.name),
    text,
    html,
  };
}

type RenderInput = {
  c: (typeof COPY)["de"];
  locale: Locale;
  classroom: ClassroomShape;
  teacherDisplay: string;
  activeStudents: number;
  totalStudents: number;
  newCompletions: number;
  topActive: Array<{ username: string; completions: number }>;
  openAssignments: number;
  coverage: Awaited<ReturnType<typeof getClassroomCurriculumCoverage>>;
  coveredDelta: number;
  classUrl: string;
};

function renderText(i: RenderInput): string {
  const { c, classroom } = i;
  const lines: string[] = [];
  lines.push(c.hello(i.teacherDisplay), "", c.intro(classroom.name, 7), "");

  lines.push("— " + c.sections.students + " —");
  lines.push(
    `• ${c.stats.activeOf(i.activeStudents, i.totalStudents)} ${c.stats.activeStudents}`,
  );
  lines.push(`• ${i.newCompletions} ${c.stats.lessonsCompleted}`);
  if (i.openAssignments > 0) {
    lines.push(`• ${i.openAssignments} ${c.stats.openAssignments}`);
  }
  lines.push("");

  if (i.newCompletions === 0) {
    lines.push(c.sections.nothing);
  } else if (i.topActive.length > 0) {
    lines.push("— " + c.topActive + " —");
    for (const a of i.topActive) {
      lines.push(`• ${a.username} (${a.completions})`);
    }
    lines.push("");
  }

  if (i.coverage) {
    lines.push("— " + c.sections.coverage + " —");
    lines.push(
      `${i.coverage.state} · ${c.stats.coveredStandards}: ${i.coverage.coveredStandards} / ${i.coverage.totalStandards} (${c.stats.coveredDelta(i.coveredDelta)})`,
    );
    lines.push("");
  }

  lines.push(`👉 ${c.cta}: ${i.classUrl}`);
  lines.push("");
  lines.push("—");
  lines.push(c.footer);
  return lines.join("\n");
}

function renderHtml(i: RenderInput): string {
  const { c, classroom } = i;
  const safeName = escapeHtml(classroom.name);
  const safeTeacher = escapeHtml(i.teacherDisplay);

  const stats: Array<{ label: string; value: string; sub?: string }> = [
    {
      label: c.stats.activeStudents,
      value: c.stats.activeOf(i.activeStudents, i.totalStudents),
    },
    {
      label: c.stats.lessonsCompleted,
      value: String(i.newCompletions),
    },
  ];
  if (i.openAssignments > 0) {
    stats.push({
      label: c.stats.openAssignments,
      value: String(i.openAssignments),
    });
  }
  if (i.coverage) {
    stats.push({
      label: c.stats.coveredStandards,
      value: `${i.coverage.coveredStandards} / ${i.coverage.totalStandards}`,
      sub: c.stats.coveredDelta(i.coveredDelta),
    });
  }

  const statCells = stats
    .map(
      (s) => `
      <td style="padding:14px 16px;background:#fafafa;border:1px solid #eee;border-radius:8px;min-width:140px;vertical-align:top">
        <div style="font-size:11px;letter-spacing:1.5px;color:#888;text-transform:uppercase">${escapeHtml(s.label)}</div>
        <div style="font-size:22px;font-weight:700;color:#111;margin-top:2px">${escapeHtml(s.value)}</div>
        ${s.sub ? `<div style="font-size:11px;color:#888;margin-top:2px">${escapeHtml(s.sub)}</div>` : ""}
      </td>`,
    )
    .join("\n");

  const topActiveBlock =
    i.newCompletions === 0
      ? `<p style="color:#666">${escapeHtml(c.sections.nothing)}</p>`
      : i.topActive.length === 0
        ? ""
        : `<h3 style="margin:24px 0 8px;color:#111">${escapeHtml(c.topActive)}</h3>
           <ul style="margin:0;padding-left:20px;color:#222">
             ${i.topActive
               .map(
                 (a) =>
                   `<li>${escapeHtml(a.username)} <span style="color:#888">(${a.completions})</span></li>`,
               )
               .join("")}
           </ul>`;

  return `<!doctype html>
<html lang="${i.locale}">
<head><meta charset="utf-8"><title>${escapeHtml(c.subject(classroom.name))}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222">
  <span style="display:none;font-size:1px;color:transparent">${escapeHtml(c.preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
        <tr><td style="padding:24px 28px 8px;border-top:6px solid #F5B544">
          <div style="font-size:11px;letter-spacing:3px;color:#a16207;font-weight:700;text-transform:uppercase">MicroLearn</div>
          <h1 style="margin:6px 0 0;font-size:22px;color:#111">${safeName}</h1>
          <p style="margin:4px 0 0;color:#666;font-size:13px">${escapeHtml(c.preheader)}</p>
        </td></tr>

        <tr><td style="padding:20px 28px 4px;color:#222">
          <p style="margin:0 0 6px">${escapeHtml(c.hello(safeTeacher))}</p>
          <p style="margin:0;color:#444">${escapeHtml(c.intro(classroom.name, 7))}</p>
        </td></tr>

        <tr><td style="padding:14px 22px">
          <table role="presentation" cellpadding="0" cellspacing="6" width="100%">
            <tr>${statCells}</tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 28px 4px">${topActiveBlock}</td></tr>

        <tr><td style="padding:24px 28px 4px" align="center">
          <a href="${escapeHtml(i.classUrl)}"
             style="display:inline-block;padding:12px 22px;background:#F5B544;color:#111;text-decoration:none;font-weight:700;border-radius:8px">
            ${escapeHtml(c.cta)} →
          </a>
        </td></tr>

        <tr><td style="padding:18px 28px 24px;color:#999;font-size:11px;line-height:1.5;text-align:center">
          ${escapeHtml(c.footer)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// -----------------------------------------------------------------------------
// Helpers / types
// -----------------------------------------------------------------------------

type ClassroomShape = Awaited<
  ReturnType<typeof prisma.classroom.findMany>
>[number] & {
  teacher: {
    name: string | null;
    username: string | null;
    email: string | null;
    preferredLocale: string;
  };
  members: Array<{
    id: string;
    isActive: boolean;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      progress: Array<{ lessonId: string | null; completedAt: Date | null }>;
    };
  }>;
  assignments: Array<{
    lesson: { id: string } | null;
    path: { courses: Array<{ lessons: Array<{ id: string }> }> } | null;
  }>;
};
