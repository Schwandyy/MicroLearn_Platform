import "server-only";
import { MeiliSearch } from "meilisearch";
import { prisma } from "@/server/db/prisma";

const host = process.env.MEILISEARCH_HOST;
const apiKey = process.env.MEILISEARCH_MASTER_KEY;

export const meili = host
  ? new MeiliSearch({ host, apiKey })
  : null;

export const SEARCH_INDEX = {
  LESSONS: "lessons",
  PATHS: "paths",
  PROJECTS: "projects",
} as const;

export async function ensureIndexes() {
  if (!meili) return;
  for (const [, name] of Object.entries(SEARCH_INDEX)) {
    const index = meili.index(name);
    await index.updateSettings({
      searchableAttributes: ["title_de", "title_en", "body_de", "body_en", "summary_de", "summary_en", "tags"],
      filterableAttributes: ["locale", "level", "boards", "kind"],
      sortableAttributes: ["sortOrder", "publishedAt"],
    }).catch(() => undefined);
  }
}

export async function reindexAll() {
  if (!meili) return { ok: false, error: "meili_disabled" } as const;
  await ensureIndexes();

  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true },
    include: { recommendedBoards: true, course: { include: { path: true } } },
  });
  const paths = await prisma.learningPath.findMany({
    where: { isPublished: true },
  });
  const projects = await prisma.project.findMany({
    where: { isPublic: true },
    include: { boards: true },
  });

  await meili.index(SEARCH_INDEX.LESSONS).addDocuments(
    lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      title_de: l.title_de,
      title_en: l.title_en,
      summary_de: l.body_de.slice(0, 200),
      summary_en: l.body_en.slice(0, 200),
      level: l.course?.path?.level ?? null,
      boards: l.recommendedBoards.map((b) => b.slug),
      kind: l.kind,
      pathSlug: l.course?.path?.slug ?? null,
      publishedAt: l.publishedAt?.getTime() ?? 0,
    })),
  );

  await meili.index(SEARCH_INDEX.PATHS).addDocuments(
    paths.map((p) => ({
      id: p.id,
      slug: p.slug,
      title_de: p.title_de,
      title_en: p.title_en,
      summary_de: p.summary_de,
      summary_en: p.summary_en,
      level: p.level,
      publishedAt: p.publishedAt?.getTime() ?? 0,
    })),
  );

  await meili.index(SEARCH_INDEX.PROJECTS).addDocuments(
    projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title_de: p.title_de,
      title_en: p.title_en,
      boards: p.boards.map((b) => b.slug),
    })),
  );

  return {
    ok: true as const,
    counts: {
      lessons: lessons.length,
      paths: paths.length,
      projects: projects.length,
    },
  };
}

export async function search(query: string, locale: "de" | "en") {
  if (!meili) return { lessons: [], paths: [], projects: [] };
  const [lessons, paths, projects] = await Promise.all([
    meili.index(SEARCH_INDEX.LESSONS).search(query, { limit: 10 }),
    meili.index(SEARCH_INDEX.PATHS).search(query, { limit: 5 }),
    meili.index(SEARCH_INDEX.PROJECTS).search(query, { limit: 5 }),
  ]);
  void locale;
  return {
    lessons: lessons.hits,
    paths: paths.hits,
    projects: projects.hits,
  };
}
