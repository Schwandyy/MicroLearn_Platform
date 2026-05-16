import "server-only";
import { prisma } from "@/server/db/prisma";
import type { LearnerLevel } from "@prisma/client";

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
};

export type TeacherProgramSuggestion = {
  classroomName: string;
  state: string | null;
  grade: number | null;
  level: LearnerLevel;
  lessons: SuggestedLesson[];
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

/**
 * Build a 4-week deterministic program for a teacher's state+grade.
 *
 * Algorithm:
 * - Map grade → LearnerLevel via [[gradeToLevel]].
 * - Pull all published lessons whose course's path matches that level
 *   (or one level below as warm-up), ordered by `course.sortOrder` then `lesson.sortOrder`.
 * - Take the first 4 distinct lessons → assign to weeks 0..3.
 * - Stagger due dates by 7 days starting from `Math.max(today+3d, next Monday)`.
 *
 * Future Phase 7.4.1: enrich with CurriculumStandard match for state+grade and
 * pass the candidate set to Claude for ranking + reasoning.
 */
export async function buildTeacherProgram(opts: {
  state: string | null;
  grade: number | null;
  locale: "de" | "en";
}): Promise<TeacherProgramSuggestion> {
  const level = gradeToLevel(opts.grade);
  // Allow paths on this level + one below for variety
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
    },
    orderBy: [{ course: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    take: 50,
  });

  // Prefer exact-level lessons first, then below
  const sorted = [...lessons].sort((a, b) => {
    const aExact = a.course.path.level === level ? 0 : 1;
    const bExact = b.course.path.level === level ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    const aPath = a.course.path.sortOrder ?? 0;
    const bPath = b.course.path.sortOrder ?? 0;
    if (aPath !== bPath) return aPath - bPath;
    return (a.course.sortOrder ?? 0) - (b.course.sortOrder ?? 0);
  });

  const picked = sorted.slice(0, 4);

  // Start date: today + 3 days (gives admins a week to prep)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startBase = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const suggestedLessons: SuggestedLesson[] = picked.map((l, i) => {
    const due = new Date(startBase.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    return {
      lessonId: l.id,
      lessonSlug: l.slug,
      title_de: l.title_de,
      title_en: l.title_en,
      summary_de: l.summary_de,
      summary_en: l.summary_en,
      estimatedMinutes: l.estimatedMinutes,
      weekIndex: i,
      dueAt: due.toISOString(),
    };
  });

  return {
    classroomName: classroomNameFor(opts.state, opts.grade ?? null, opts.locale),
    state: opts.state,
    grade: opts.grade,
    level,
    lessons: suggestedLessons,
  };
}
