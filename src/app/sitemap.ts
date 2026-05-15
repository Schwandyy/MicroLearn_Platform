import type { MetadataRoute } from "next";
import { prisma } from "@/server/db/prisma";

const LOCALES = ["de", "en"] as const;
const STATIC_PATHS = ["", "/paths", "/projects", "/pricing"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://microlearn.app";

  const url = (path: string) => `${base}${path}`;

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of LOCALES) {
    for (const p of STATIC_PATHS) {
      entries.push({
        url: url(`/${locale}${p}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: p === "" ? 1.0 : 0.7,
      });
    }
  }

  // Dynamische Lern-Inhalte
  const [paths, lessons, projects] = await Promise.all([
    prisma.learningPath.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.lesson.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.project.findMany({
      where: { isPublic: true },
      select: { slug: true, updatedAt: true },
    }),
  ]).catch(() => [[], [], []] as const);

  for (const locale of LOCALES) {
    for (const p of paths) {
      entries.push({
        url: url(`/${locale}/paths/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const l of lessons) {
      entries.push({
        url: url(`/${locale}/lessons/${l.slug}`),
        lastModified: l.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const pr of projects) {
      entries.push({
        url: url(`/${locale}/projects/${pr.slug}`),
        lastModified: pr.updatedAt,
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }
  }

  return entries;
}
