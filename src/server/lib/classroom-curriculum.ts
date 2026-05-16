import "server-only";
import { prisma } from "@/server/db/prisma";

export type CurriculumStandardRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  subject: string;
  grade: number;
  lessonsCovered: number;
  /** memberIds of students who completed ≥1 lesson tagged to this standard. */
  coveredMemberIds: string[];
};

export type CurriculumCoverage = {
  state: string;
  grade: number;
  totalStandards: number;
  coveredStandards: number;
  rows: CurriculumStandardRow[];
};

type Member = { id: string; userId: string };

/**
 * Compute curriculum-coverage data for a single classroom. Returns null when
 * the classroom has no curriculum scope (state + grade) — callers should
 * surface a friendly "set state + grade to enable coverage" hint in that case.
 *
 * Shared between the Lehrer-PDF route and the in-app Coverage-Heatmap so the
 * numbers can never drift between the two surfaces.
 */
export async function getClassroomCurriculumCoverage(opts: {
  state: string | null | undefined;
  grade: number | null | undefined;
  members: Member[];
  locale: "de" | "en";
}): Promise<CurriculumCoverage | null> {
  if (!opts.state || opts.grade == null) return null;

  const standards = await prisma.curriculumStandard.findMany({
    where: { state: opts.state, grade: { lte: opts.grade } },
    orderBy: [{ grade: "asc" }, { subject: "asc" }, { sortOrder: "asc" }],
    include: {
      lessons: {
        include: {
          lesson: {
            select: {
              id: true,
              progress: {
                where: { completedAt: { not: null } },
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  const userIdToMember = new Map<string, string>();
  for (const m of opts.members) userIdToMember.set(m.userId, m.id);

  const rows: CurriculumStandardRow[] = standards.map((s) => {
    const memberIds = new Set<string>();
    for (const link of s.lessons) {
      for (const p of link.lesson.progress) {
        const mid = userIdToMember.get(p.userId);
        if (mid) memberIds.add(mid);
      }
    }
    return {
      id: s.id,
      code: s.code,
      title: opts.locale === "en" ? s.title_en : s.title_de,
      description:
        opts.locale === "en" ? s.description_en : s.description_de,
      subject: s.subject,
      grade: s.grade,
      lessonsCovered: s.lessons.length,
      coveredMemberIds: Array.from(memberIds),
    };
  });

  return {
    state: opts.state,
    grade: opts.grade,
    totalStandards: rows.length,
    coveredStandards: rows.filter((r) => r.coveredMemberIds.length > 0).length,
    rows,
  };
}
