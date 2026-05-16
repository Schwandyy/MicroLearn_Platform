import "server-only";
import { fetchHtml, htmlToMarkdown } from "./util";
import type { Scraper, ScrapedDoc } from "./types";

const FEED_URL = "https://learn.adafruit.com/feed";

/**
 * Adafruit Learning System — tutorials for Arduino, CircuitPython, MicroPython,
 * sensors, displays, robotics. Listing via the public ATOM feed at /feed.
 *
 * Attribution: every scraped guide retains its `sourceUrl`, which Claude is
 * instructed to credit in the generated lesson body.
 */
export const adafruitLearnScraper: Scraper = {
  source: "ADAFRUIT_LEARN",
  async list(limit = 15) {
    const xml = await fetchHtml(FEED_URL);
    if (!xml) return [];
    const urls = extractAlternateLinks(xml).filter((u) =>
      u.startsWith("https://learn.adafruit.com/"),
    );
    return Array.from(new Set(urls)).slice(0, limit);
  },
  async fetch(url): Promise<ScrapedDoc | null> {
    const html = await fetchHtml(url);
    if (!html) return null;
    const { title, markdown } = htmlToMarkdown(html);
    if (!markdown || markdown.length < 400) return null;
    return {
      source: "ADAFRUIT_LEARN",
      sourceUrl: url,
      title,
      markdown,
      rawHtml: html,
      language: "en",
    };
  },
};

function extractAlternateLinks(xml: string): string[] {
  // ATOM uses <link rel="alternate" type="text/html" href="..."/> per entry.
  // We restrict to alternate-type links to avoid catching <link rel="self">.
  const out: string[] = [];
  const re = /<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"[^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}
