import "server-only";
import { fetchHtml, htmlToMarkdown } from "./util";
import type { Scraper, ScrapedDoc } from "./types";

const FEED_URL = "https://www.hackster.io/projects.atom";

const TOPIC_KEYWORDS = [
  "esp32",
  "esp8266",
  "arduino",
  "micropython",
  "circuitpython",
  "raspberry",
  "stm32",
  "pi pico",
  "rp2040",
  "neopixel",
];

/**
 * Hackster.io — large community of maker projects. Listing via the public
 * `/projects.atom` feed. We filter feed entries by topic keywords so we only
 * crawl projects relevant to our microcontroller curriculum.
 *
 * Attribution: every project page is preserved as `sourceUrl` so the Claude
 * pipeline can credit the original author in the generated lesson.
 */
export const hacksterScraper: Scraper = {
  source: "HACKSTER",
  async list(limit = 15) {
    const xml = await fetchHtml(FEED_URL);
    if (!xml) return [];
    const candidates = extractRelevantEntries(xml);
    return candidates.slice(0, limit);
  },
  async fetch(url): Promise<ScrapedDoc | null> {
    const html = await fetchHtml(url);
    if (!html) return null;
    const { title, markdown } = htmlToMarkdown(html);
    if (!markdown || markdown.length < 400) return null;
    return {
      source: "HACKSTER",
      sourceUrl: url,
      title,
      markdown,
      rawHtml: html,
      language: "en",
    };
  },
};

function extractRelevantEntries(xml: string): string[] {
  // Each <entry>…</entry> block holds one project. We keep the entry only when
  // its title/content references one of our microcontroller topic keywords.
  const out: string[] = [];
  const entryRe = /<entry\b[\s\S]*?<\/entry>/gi;
  let entry: RegExpExecArray | null;
  while ((entry = entryRe.exec(xml)) !== null) {
    const block = entry[0];
    const linkMatch = /<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/i.exec(
      block,
    );
    const url = linkMatch?.[1];
    if (!url || !url.startsWith("https://www.hackster.io/")) continue;
    const lower = block.toLowerCase();
    if (!TOPIC_KEYWORDS.some((k) => lower.includes(k))) continue;
    if (!out.includes(url)) out.push(url);
  }
  return out;
}
