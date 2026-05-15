import "server-only";
import { prisma } from "@/server/db/prisma";
import { generateLessonFromScrape, aiPreCheck } from "./ai-content";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Verarbeitet einen frischen ScrapedContent-Eintrag:
 * 1. Claude generiert bilinguale Lesson
 * 2. KI-Pre-Check (Safety/Logic/Compat/Language)
 * 3. Lesson + ContentReview in DB anlegen — Status: AI_FLAGGED (bei Warns/Blockern) oder PENDING
 */
export async function processScrapedContent(scrapedId: string) {
  const scraped = await prisma.scrapedContent.findUnique({
    where: { id: scrapedId },
  });
  if (!scraped) return { ok: false, error: "not_found" } as const;
  if (!scraped.parsedMarkdown) return { ok: false, error: "no_content" } as const;

  const gen = await generateLessonFromScrape({
    sourceTitle: scraped.parsedTitle,
    sourceUrl: scraped.sourceUrl,
    markdown: scraped.parsedMarkdown,
  });

  if (gen.reject || !gen.lesson) {
    await prisma.scrapedContent.update({
      where: { id: scrapedId },
      data: { notes: `Reject: ${gen.reject ?? "no lesson"}` },
    });
    return { ok: false, error: gen.reject ?? "generation_failed" } as const;
  }

  const lesson = gen.lesson;

  // Map board slugs to ids
  const boards = lesson.boardSlugs.length
    ? await prisma.board.findMany({
        where: { slug: { in: lesson.boardSlugs } },
      })
    : [];

  // Pick or create a "Inbox" course in a fallback path
  const fallbackPath = await prisma.learningPath.upsert({
    where: { slug: "ai-content-inbox" },
    create: {
      slug: "ai-content-inbox",
      level: "L2_NOVICE",
      sortOrder: 999,
      title_de: "KI-Eingang (interne Sammelablage)",
      title_en: "AI Inbox (internal staging)",
      summary_de: "Automatisch generierte Lernmodule — vor Veröffentlichung manuell prüfen.",
      summary_en: "Auto-generated lessons — review manually before publishing.",
      isPublished: false,
    },
    update: {},
  });

  const inboxCourse = await prisma.course.upsert({
    where: { slug: "ai-content-inbox-default" },
    create: {
      slug: "ai-content-inbox-default",
      pathId: fallbackPath.id,
      sortOrder: 0,
      title_de: "Inbox",
      title_en: "Inbox",
      summary_de: "Sammelablage",
      summary_en: "Staging",
      isPublished: false,
    },
    update: {},
  });

  const baseSlug = slugify(lesson.title_en || lesson.title_de || "lesson");
  const slug = `${baseSlug}-${scrapedId.slice(0, 8)}`;

  const created = await prisma.lesson.create({
    data: {
      slug,
      courseId: inboxCourse.id,
      sortOrder: 0,
      kind: lesson.kind,
      xpReward: lesson.kind === "PROJECT" ? 100 : 50,
      estimatedMinutes: Math.max(5, Math.min(180, lesson.estimatedMinutes || 30)),
      title_de: lesson.title_de,
      title_en: lesson.title_en,
      body_de: lesson.body_de,
      body_en: lesson.body_en,
      codeSnippet: lesson.codeSnippet,
      schematicNotes_de: lesson.schematicNotes_de,
      schematicNotes_en: lesson.schematicNotes_en,
      safetyNotes_de: lesson.safetyNotes_de,
      safetyNotes_en: lesson.safetyNotes_en,
      wokwiProjectId: lesson.wokwiProjectId,
      isPublished: false,
      recommendedBoards: boards.length
        ? { connect: boards.map((b) => ({ id: b.id })) }
        : undefined,
      scrapedSources: { connect: [{ id: scrapedId }] },
      bom: {
        create: lesson.bom.slice(0, 25).map((item) => ({
          quantity: Math.max(1, Math.floor(item.quantity || 1)),
          note_de: item.note_de ?? null,
          note_en: item.note_en ?? null,
        })),
      },
    },
  });

  // AI pre-check
  let review;
  try {
    const report = await aiPreCheck(lesson);
    const status =
      report.overall === "FAIL"
        ? "AI_FLAGGED"
        : report.overall === "WARN"
          ? "AI_FLAGGED"
          : "PENDING";
    review = await prisma.contentReview.create({
      data: {
        lessonId: created.id,
        scrapedId,
        status,
        aiFlags: report.flags,
        aiSummary_de: report.summary_de,
        aiSummary_en: report.summary_en,
      },
    });
  } catch (err) {
    review = await prisma.contentReview.create({
      data: {
        lessonId: created.id,
        scrapedId,
        status: "PENDING",
        aiFlags: [],
        aiSummary_de: `Pre-check fehlgeschlagen: ${(err as Error).message}`,
        aiSummary_en: `Pre-check failed: ${(err as Error).message}`,
      },
    });
  }

  return { ok: true as const, lessonId: created.id, reviewId: review.id };
}

export async function processQueue(limit = 5) {
  const pending = await prisma.scrapedContent.findMany({
    where: { lesson: null, parsedMarkdown: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const results = [];
  for (const item of pending) {
    const res = await processScrapedContent(item.id);
    results.push({ scrapedId: item.id, ...res });
  }
  return results;
}
