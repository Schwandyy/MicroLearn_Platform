import "server-only";
import { prisma } from "@/server/db/prisma";
import type { LearnerLevel } from "@prisma/client";
import { anthropic, ANTHROPIC_MODEL_CONTENT } from "@/server/lib/anthropic";

export type MatchedStandard = {
  id: string;
  code: string;
  state: string;
  grade: number;
  subject: string;
  title: string;
};

export type SuggestedLesson = {
  lessonId: string;
  lessonSlug: string;
  title_de: string;
  title_en: string;
  summary_de: string;
  summary_en: string;
  estimatedMinutes: number | null;
  weekIndex: number; // 0..3
  dueAt: string; // ISO date
  matchedStandards: MatchedStandard[];
  curriculumReason: string | null;
};

export type TeacherProgramSuggestion = {
  classroomName: string;
  state: string | null;
  grade: number | null;
  level: LearnerLevel;
  lessons: SuggestedLesson[];
  aiRanked: boolean;
};

export function gradeToLevel(grade: number | null | undefined): LearnerLevel {
  if (!grade) return "L1_BEGINNER";
  if (grade <= 4) return "L1_BEGINNER";
  if (grade <= 7) return "L2_NOVICE";
  if (grade <= 10) return "L3_INTERMEDIATE";
  return "L4_EXPERT";
}

function classroomNameFor(state: string | null, grade: number | null, locale: "de" | "en"): string {
  const gradeLabel = grade
    ? locale === "de"
      ? `Klasse ${grade}`
      : `Grade ${grade}`
    : locale === "de"
      ? "Klasse"
      : "Class";
  if (state) return `${gradeLabel} ${state}`;
  return gradeLabel;
}

type Candidate = {
  id: string;
  slug: string;
  title_de: string;
  title_en: string;
  summary_de: string;
  summary_en: string;
  estimatedMinutes: number | null;
  matched: MatchedStandard[];
  exactLevel: boolean;
  pathSortOrder: number;
  courseSortOrder: number;
};

/**
 * Build a 4-week program for a teacher's state+grade.
 *
 * Two-pass design:
 *   1. Deterministic pool (up to 12) ordered by level-fit + course order,
 *      enriched with curriculum standards already linked to each lesson
 *      that match the teacher's state and grade.
 *   2. Optional Claude pass picks the final Top-4 with a 1-sentence
 *      curriculum reason per pick. Falls back to deterministic Top-4 if no
 *      API key is set, no candidates have matching standards, or the model
 *      returns garbage.
 */
export async function buildTeacherProgram(opts: {
  state: string | null;
  grade: number | null;
  locale: "de" | "en";
}): Promise<TeacherProgramSuggestion> {
  const level = gradeToLevel(opts.grade);
  const includedLevels: LearnerLevel[] =
    level === "L1_BEGINNER"
      ? ["L1_BEGINNER"]
      : level === "L2_NOVICE"
        ? ["L2_NOVICE", "L1_BEGINNER"]
        : level === "L3_INTERMEDIATE"
          ? ["L3_INTERMEDIATE", "L2_NOVICE"]
          : ["L4_EXPERT", "L3_INTERMEDIATE"];

  const lessons = await prisma.lesson.findMany({
    where: {
      isPublished: true,
      course: {
        isPublished: true,
        path: { level: { in: includedLevels }, isPublished: true },
      },
    },
    select: {
      id: true,
      slug: true,
      title_de: true,
      title_en: true,
      summary_de: true,
      summary_en: true,
      estimatedMinutes: true,
      sortOrder: true,
      course: {
        select: {
          sortOrder: true,
          path: { select: { level: true, sortOrder: true } },
        },
      },
      curriculumLinks: {
        select: {
          standard: {
            select: {
              id: true,
              code: true,
              state: true,
              grade: true,
              subject: true,
              title_de: true,
              title_en: true,
            },
          },
        },
      },
    },
    orderBy: [{ course: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    take: 50,
  });

  const candidates: Candidate[] = lessons.map((l) => {
    const matched = l.curriculumLinks
      .map((link) => link.standard)
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .filter((s) => {
        if (opts.state && s.state !== opts.state) return false;
        if (opts.grade != null && s.grade > opts.grade) return false;
        return true;
      })
      .map<MatchedStandard>((s) => ({
        id: s.id,
        code: s.code,
        state: s.state,
        grade: s.grade,
        subject: s.subject,
        title: opts.locale === "en" ? s.title_en : s.title_de,
      }));

    return {
      id: l.id,
      slug: l.slug,
      title_de: l.title_de,
      title_en: l.title_en,
      summary_de: l.summary_de,
      summary_en: l.summary_en,
      estimatedMinutes: l.estimatedMinutes,
      matched,
      exactLevel: l.course.path.level === level,
      pathSortOrder: l.course.path.sortOrder ?? 0,
      courseSortOrder: l.course.sortOrder ?? 0,
    };
  });

  // Deterministic ranking: standards-match count (desc) ► exact level
  // ► path order ► course order. Then keep up to 12 for the AI ranker.
  const sorted = [...candidates].sort((a, b) => {
    if (a.matched.length !== b.matched.length) return b.matched.length - a.matched.length;
    if (a.exactLevel !== b.exactLevel) return a.exactLevel ? -1 : 1;
    if (a.pathSortOrder !== b.pathSortOrder) return a.pathSortOrder - b.pathSortOrder;
    return a.courseSortOrder - b.courseSortOrder;
  });

  const pool = sorted.slice(0, 12);

  let ranked: Array<{ candidate: Candidate; reason: string | null }> = pool
    .slice(0, 4)
    .map((c) => ({ candidate: c, reason: null }));
  let aiRanked = false;

  // Only bother with Claude if there are matched standards to talk about
  // *and* we have an API key. Otherwise the deterministic Top-4 is fine.
  const poolHasStandards = pool.some((c) => c.matched.length > 0);
  if (anthropic && poolHasStandards && opts.state && opts.grade != null) {
    const fromAI = await rankWithClaude({
      pool,
      state: opts.state,
      grade: opts.grade,
      locale: opts.locale,
    });
    if (fromAI && fromAI.length > 0) {
      ranked = fromAI;
      aiRanked = true;
    }
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startBase = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const suggestedLessons: SuggestedLesson[] = ranked.slice(0, 4).map(({ candidate, reason }, i) => {
    const due = new Date(startBase.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    return {
      lessonId: candidate.id,
      lessonSlug: candidate.slug,
      title_de: candidate.title_de,
      title_en: candidate.title_en,
      summary_de: candidate.summary_de,
      summary_en: candidate.summary_en,
      estimatedMinutes: candidate.estimatedMinutes,
      weekIndex: i,
      dueAt: due.toISOString(),
      matchedStandards: candidate.matched.slice(0, 3),
      curriculumReason: reason,
    };
  });

  return {
    classroomName: classroomNameFor(opts.state, opts.grade ?? null, opts.locale),
    state: opts.state,
    grade: opts.grade,
    level,
    lessons: suggestedLessons,
    aiRanked,
  };
}

async function rankWithClaude(args: {
  pool: Candidate[];
  state: string;
  grade: number;
  locale: "de" | "en";
}): Promise<Array<{ candidate: Candidate; reason: string }> | null> {
  if (!anthropic) return null;

  const candidatesForPrompt = args.pool.map((c) => ({
    id: c.id,
    title: args.locale === "en" ? c.title_en : c.title_de,
    summary: args.locale === "en" ? c.summary_en : c.summary_de,
    minutes: c.estimatedMinutes,
    matched_standards: c.matched.map((s) => ({
      code: s.code,
      grade: s.grade,
      subject: s.subject,
      title: s.title,
    })),
  }));

  const system =
    args.locale === "en"
      ? `You plan a 4-week MicroLearn classroom for a teacher. Pick exactly 4 lessons from the candidate list and order them as Week 1..4. Prefer lessons whose matched curriculum standards align with the teacher's state and grade — but stay strict: never invent standards, never pick more than 4. Each pick gets a one-sentence reason in the teacher's language explaining the curriculum fit and the pedagogical sequence. Respond ONLY with valid JSON matching the user schema.`
      : `Du planst eine 4-Wochen-MicroLearn-Klasse für eine Lehrkraft. Wähle genau 4 Lessons aus der Kandidatenliste und ordne sie als Woche 1..4. Bevorzuge Lessons, deren gematchte Lehrplan-Standards zu Bundesland und Klassenstufe passen — aber bleib streng: erfinde keine Standards, nie mehr als 4. Pro Pick eine einsatzige Begründung in der Sprache der Lehrkraft mit Lehrplan-Bezug und didaktischer Reihenfolge. Antworte AUSSCHLIESSLICH mit gültigem JSON gemäß User-Schema.`;

  const userPayload = {
    schema: {
      weeks: [
        {
          lessonId: "<id from candidates>",
          reason: "<one sentence, max 200 chars>",
        },
      ],
    },
    teacher: { state: args.state, grade: args.grade, locale: args.locale },
    candidates: candidatesForPrompt,
  };

  try {
    const res = await anthropic.messages.create({
      model: ANTHROPIC_MODEL_CONTENT,
      max_tokens: 800,
      temperature: 0,
      system,
      messages: [{ role: "user", content: JSON.stringify(userPayload) }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    const parsed = JSON.parse(stripCodeFence(text)) as {
      weeks?: Array<{ lessonId?: string; reason?: string }>;
    };
    const byId = new Map(args.pool.map((c) => [c.id, c]));
    const picks: Array<{ candidate: Candidate; reason: string }> = [];
    const seen = new Set<string>();
    for (const week of parsed.weeks ?? []) {
      const id = typeof week.lessonId === "string" ? week.lessonId : null;
      if (!id || seen.has(id)) continue;
      const candidate = byId.get(id);
      if (!candidate) continue;
      picks.push({
        candidate,
        reason:
          typeof week.reason === "string"
            ? week.reason.slice(0, 220).trim()
            : "",
      });
      seen.add(id);
      if (picks.length === 4) break;
    }
    if (picks.length === 0) return null;
    // Fill up from deterministic pool if AI gave fewer than 4.
    if (picks.length < 4) {
      for (const c of args.pool) {
        if (picks.length === 4) break;
        if (seen.has(c.id)) continue;
        picks.push({ candidate: c, reason: "" });
        seen.add(c.id);
      }
    }
    return picks;
  } catch {
    return null;
  }
}

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced?.[1] ?? text;
}
