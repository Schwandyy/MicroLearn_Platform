import "server-only";
import { prisma } from "@/server/db/prisma";
import { azDeliveryScraper } from "./az-delivery";
import { randomNerdScraper } from "./random-nerd";
import { githubReadmeScraper } from "./github-readme";
import { wokwiScraper } from "./wokwi";
import type { Scraper } from "./types";

export const SCRAPERS: Scraper[] = [
  azDeliveryScraper,
  randomNerdScraper,
  githubReadmeScraper,
  wokwiScraper,
  // Weitere folgen: hackster.io, arduino.cc/Tutorial, adafruit.com/learn
];

export async function runScrapers(opts: { perSource?: number } = {}) {
  const perSource = opts.perSource ?? 5;
  const results: { source: string; created: number; skipped: number }[] = [];

  for (const scraper of SCRAPERS) {
    let created = 0;
    let skipped = 0;
    const urls = await scraper.list(perSource);
    for (const url of urls) {
      const existing = await prisma.scrapedContent.findUnique({
        where: { sourceUrl: url },
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      const doc = await scraper.fetch(url);
      if (!doc) {
        skipped += 1;
        continue;
      }
      await prisma.scrapedContent.create({
        data: {
          source: doc.source,
          sourceUrl: doc.sourceUrl,
          rawHtml: doc.rawHtml.slice(0, 1_000_000),
          parsedTitle: doc.title ?? null,
          parsedMarkdown: doc.markdown,
          language: doc.language ?? null,
        },
      });
      created += 1;
    }
    results.push({ source: scraper.source, created, skipped });
  }

  return results;
}
