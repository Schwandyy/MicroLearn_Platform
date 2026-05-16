import { NextResponse } from "next/server";
import { search, meili } from "@/server/lib/meilisearch";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

interface SearchHit {
  slug: string;
  title: string;
  snippet: string;
}

interface SearchResults {
  lessons: SearchHit[];
  paths: SearchHit[];
  projects: SearchHit[];
}

async function dbSearch(q: string, locale: "de" | "en"): Promise<SearchResults> {
  // Prisma-Fallback wenn Meilisearch nicht konfiguriert ist.
  // ILIKE-Search auf Titel + Body, gut bis ~10k Inhalte.
  const titleField = locale === "de" ? "title_de" : "title_en";
  const bodyField = locale === "de" ? "body_de" : "body_en";
  const summaryField = locale === "de" ? "summary_de" : "summary_en";

  const [lessons, paths, projects] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        isPublished: true,
        OR: [
          { [titleField]: { contains: q, mode: "insensitive" } },
          { [bodyField]: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        title_de: true,
        title_en: true,
        body_de: true,
        body_en: true,
      },
      take: 10,
    }),
    prisma.learningPath.findMany({
      where: {
        isPublished: true,
        OR: [
          { [titleField]: { contains: q, mode: "insensitive" } },
          { [summaryField]: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        title_de: true,
        title_en: true,
        summary_de: true,
        summary_en: true,
      },
      take: 10,
    }),
    prisma.project.findMany({
      where: {
        isPublic: true,
        OR: [
          { [titleField]: { contains: q, mode: "insensitive" } },
          { [bodyField]: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        title_de: true,
        title_en: true,
        body_de: true,
        body_en: true,
      },
      take: 10,
    }),
  ]);

  const pickTitle = (o: { title_de: string; title_en: string }) =>
    locale === "de" ? o.title_de : o.title_en;
  const pickSnippet = (
    o: {
      body_de?: string;
      body_en?: string;
      summary_de?: string;
      summary_en?: string;
    },
  ) =>
    (locale === "de"
      ? (o.body_de ?? o.summary_de ?? "")
      : (o.body_en ?? o.summary_en ?? "")).slice(0, 180);

  return {
    lessons: lessons.map((l) => ({
      slug: l.slug,
      title: pickTitle(l),
      snippet: pickSnippet(l),
    })),
    paths: paths.map((p) => ({
      slug: p.slug,
      title: pickTitle(p),
      snippet: pickSnippet(p),
    })),
    projects: projects.map((p) => ({
      slug: p.slug,
      title: pickTitle(p),
      snippet: pickSnippet(p),
    })),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const locale = (url.searchParams.get("locale") ?? "de") as "de" | "en";
  if (q.length < 2) {
    return NextResponse.json({ lessons: [], paths: [], projects: [] });
  }

  if (meili) {
    try {
      const results = await search(q, locale);
      return NextResponse.json(results);
    } catch {
      // fall through
    }
  }
  const results = await dbSearch(q, locale);
  return NextResponse.json(results);
}
